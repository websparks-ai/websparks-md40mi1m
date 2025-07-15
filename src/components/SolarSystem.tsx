import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface Planet {
  name: string;
  size: number;
  distance: number;
  speed: number;
  color: string;
  texture?: string;
  moons?: Array<{
    size: number;
    distance: number;
    speed: number;
    color: string;
  }>;
}

const SolarSystem: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const planetsRef = useRef<Array<{ mesh: THREE.Mesh; orbit: number; speed: number; angle: number; moons?: Array<{ mesh: THREE.Mesh; orbit: number; speed: number; angle: number }> }>>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState<string>('');

  const planets: Planet[] = [
    { name: 'Mercury', size: 0.4, distance: 8, speed: 0.04, color: '#8C7853' },
    { name: 'Venus', size: 0.7, distance: 12, speed: 0.03, color: '#FFC649' },
    { 
      name: 'Earth', 
      size: 0.8, 
      distance: 16, 
      speed: 0.02, 
      color: '#6B93D6',
      moons: [{ size: 0.2, distance: 2, speed: 0.1, color: '#C0C0C0' }]
    },
    { name: 'Mars', size: 0.6, distance: 20, speed: 0.015, color: '#CD5C5C' },
    { 
      name: 'Jupiter', 
      size: 2.5, 
      distance: 28, 
      speed: 0.008, 
      color: '#D8CA9D',
      moons: [
        { size: 0.3, distance: 4, speed: 0.05, color: '#FFFF99' },
        { size: 0.25, distance: 5, speed: 0.04, color: '#87CEEB' }
      ]
    },
    { 
      name: 'Saturn', 
      size: 2.2, 
      distance: 36, 
      speed: 0.006, 
      color: '#FAD5A5',
      moons: [{ size: 0.4, distance: 5, speed: 0.03, color: '#F4A460' }]
    },
    { name: 'Uranus', size: 1.5, distance: 44, speed: 0.004, color: '#4FD0E7' },
    { name: 'Neptune', size: 1.4, distance: 52, speed: 0.003, color: '#4B70DD' }
  ];

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const starsPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
      starsPositions[i] = (Math.random() - 0.5) * 2000;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.5 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Sun light
    const sunLight = new THREE.PointLight(0xFFFFFF, 2, 200);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    scene.add(ambientLight);

    // Create planets
    const planetObjects: Array<{ mesh: THREE.Mesh; orbit: number; speed: number; angle: number; moons?: Array<{ mesh: THREE.Mesh; orbit: number; speed: number; angle: number }> }> = [];

    planets.forEach((planetData, index) => {
      // Planet geometry and material
      const geometry = new THREE.SphereGeometry(planetData.size, 32, 32);
      const material = new THREE.MeshLambertMaterial({ color: planetData.color });
      const planet = new THREE.Mesh(geometry, material);
      
      planet.position.x = planetData.distance;
      planet.castShadow = true;
      planet.receiveShadow = true;
      planet.userData = { name: planetData.name };
      
      scene.add(planet);

      // Create orbit line
      const orbitGeometry = new THREE.RingGeometry(planetData.distance - 0.1, planetData.distance + 0.1, 64);
      const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x444444, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = -Math.PI / 2;
      scene.add(orbit);

      const planetObj = {
        mesh: planet,
        orbit: planetData.distance,
        speed: planetData.speed,
        angle: Math.random() * Math.PI * 2,
        moons: [] as Array<{ mesh: THREE.Mesh; orbit: number; speed: number; angle: number }>
      };

      // Add Saturn rings
      if (planetData.name === 'Saturn') {
        const ringGeometry = new THREE.RingGeometry(planetData.size + 0.5, planetData.size + 1.5, 32);
        const ringMaterial = new THREE.MeshLambertMaterial({ 
          color: 0xC4A484,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = -Math.PI / 2;
        planet.add(rings);
      }

      // Add moons
      if (planetData.moons) {
        planetData.moons.forEach((moonData) => {
          const moonGeometry = new THREE.SphereGeometry(moonData.size, 16, 16);
          const moonMaterial = new THREE.MeshLambertMaterial({ color: moonData.color });
          const moon = new THREE.Mesh(moonGeometry, moonMaterial);
          
          moon.position.x = moonData.distance;
          moon.castShadow = true;
          moon.receiveShadow = true;
          
          planet.add(moon);

          planetObj.moons!.push({
            mesh: moon,
            orbit: moonData.distance,
            speed: moonData.speed,
            angle: Math.random() * Math.PI * 2
          });
        });
      }

      planetObjects.push(planetObj);
    });

    planetsRef.current = planetObjects;

    // Mouse controls
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const handleMouseMove = (event: MouseEvent) => {
      if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        camera.position.x += deltaX * 0.01;
        camera.position.y -= deltaY * 0.01;
        camera.lookAt(0, 0, 0);
      }
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseDown = () => {
      isMouseDown = true;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleWheel = (event: WheelEvent) => {
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      
      camera.position.multiplyScalar(1 + direction * zoomSpeed);
      camera.lookAt(0, 0, 0);
    };

    // Click to select planet
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.name) {
          setSelectedPlanet(clickedObject.userData.name);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (isPlaying) {
        // Rotate sun
        sun.rotation.y += 0.005 * speed;

        // Animate planets
        planetsRef.current.forEach((planetObj) => {
          // Orbit around sun
          planetObj.angle += planetObj.speed * speed;
          planetObj.mesh.position.x = Math.cos(planetObj.angle) * planetObj.orbit;
          planetObj.mesh.position.z = Math.sin(planetObj.angle) * planetObj.orbit;
          
          // Rotate planet
          planetObj.mesh.rotation.y += 0.01 * speed;

          // Animate moons
          if (planetObj.moons) {
            planetObj.moons.forEach((moonObj) => {
              moonObj.angle += moonObj.speed * speed;
              moonObj.mesh.position.x = Math.cos(moonObj.angle) * moonObj.orbit;
              moonObj.mesh.position.z = Math.sin(moonObj.angle) * moonObj.orbit;
              moonObj.mesh.rotation.y += 0.02 * speed;
            });
          }
        });

        // Rotate stars slowly
        stars.rotation.y += 0.0002 * speed;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isPlaying, speed]);

  const focusOnPlanet = (planetName: string) => {
    const planetObj = planetsRef.current.find(p => p.mesh.userData.name === planetName);
    if (planetObj && cameraRef.current) {
      const planet = planetObj.mesh;
      const distance = planetObj.orbit + 10;
      
      cameraRef.current.position.set(
        planet.position.x + distance,
        10,
        planet.position.z + distance
      );
      cameraRef.current.lookAt(planet.position);
    }
  };

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 30, 60);
      cameraRef.current.lookAt(0, 0, 0);
    }
    setSelectedPlanet('');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Controls Panel */}
      <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 text-white min-w-64">
        <h2 className="text-xl font-bold mb-4 text-yellow-400">Solar System Controls</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={resetCamera}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <i className="bi bi-house-fill"></i>
              Reset View
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Speed: {speed}x
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Focus on Planet:</label>
            <select
              value={selectedPlanet}
              onChange={(e) => {
                setSelectedPlanet(e.target.value);
                if (e.target.value) {
                  focusOnPlanet(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Planet</option>
              {planets.map((planet) => (
                <option key={planet.name} value={planet.name}>
                  {planet.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Planet Info Panel */}
      {selectedPlanet && (
        <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">{selectedPlanet}</h3>
          <div className="text-sm space-y-1">
            {(() => {
              const planet = planets.find(p => p.name === selectedPlanet);
              if (!planet) return null;
              
              return (
                <>
                  <p><span className="text-gray-400">Size:</span> {planet.size} units</p>
                  <p><span className="text-gray-400">Distance:</span> {planet.distance} AU</p>
                  <p><span className="text-gray-400">Orbital Speed:</span> {(planet.speed * 1000).toFixed(1)} km/s</p>
                  {planet.moons && (
                    <p><span className="text-gray-400">Moons:</span> {planet.moons.length}</p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-md">
        <h4 className="font-semibold mb-2 text-yellow-400">Controls:</h4>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Mouse Drag:</strong> Rotate camera view</li>
          <li>• <strong>Mouse Wheel:</strong> Zoom in/out</li>
          <li>• <strong>Click Planet:</strong> Select and get info</li>
          <li>• <strong>Dropdown:</strong> Focus on specific planet</li>
        </ul>
      </div>

      {/* Powered by Websparks AI */}
      <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs">
        <span className="text-gray-400">Powered by</span> <span className="text-yellow-400 font-semibold">Websparks AI</span>
      </div>
    </div>
  );
};

export default SolarSystem;
