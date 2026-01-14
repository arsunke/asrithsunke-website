import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float, Text } from "@react-three/drei";
import * as THREE from "three";
import "./Portfolio.css";
// ======= CLEAN SPACE BACKGROUND (replace your current 3D components with this) =======


// Small helper: smooth interpolation
const damp = THREE.MathUtils.damp;

// Procedural galaxy point cloud (no random meshes)
function GalaxyPoints({ count = 1800, radius = 18 }) {
  const ref = React.useRef();

  const geom = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color("#06b6d4"); // cyan
    const c2 = new THREE.Color("#7c3aed"); // purple
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Spiral-ish distribution
      const t = i / count;
      const arm = (i % 3) / 3; // 3 arms
      const angle = t * Math.PI * 10 + arm * Math.PI * 2;

      const r = Math.pow(Math.random(), 0.35) * radius;
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.6;
      const z = Math.sin(angle) * r + (Math.random() - 0.5) * 0.6;
      const y = (Math.random() - 0.5) * 6 * (1 - r / radius);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z - 10; // push back

      // Color gradient across radius
      tmp.copy(c1).lerp(c2, Math.min(1, r / radius));
      colors[i * 3 + 0] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count, radius]);

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.03;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.04;
  });

  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </points>
  );
}

// Simple nebula sheet using a tiny shader (soft + clean, no “shapes”)
function NebulaPlane() {
  const matRef = React.useRef();

  const material = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uC1: { value: new THREE.Color("#06b6d4") },
        uC2: { value: new THREE.Color("#7c3aed") },
        uOpacity: { value: 0.18 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uC1;
        uniform vec3 uC2;
        uniform float uOpacity;

        float hash(vec2 p){
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f*f*(3.0-2.0*f);
          return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
        }
        float fbm(vec2 p){
          float v = 0.0;
          float a = 0.5;
          for(int i=0;i<5;i++){
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main(){
          // Centered UV
          vec2 uv = vUv * 2.0 - 1.0;
          float r = length(uv);

          // Animated flow
          vec2 p = uv * 1.6;
          p.x += uTime * 0.03;
          p.y -= uTime * 0.02;

          float n = fbm(p * 2.2) * fbm(p * 1.1 + 10.0);
          float soft = smoothstep(0.15, 0.95, n);

          // Vignette-ish fade
          float fade = smoothstep(1.2, 0.25, r);

          vec3 col = mix(uC1, uC2, smoothstep(-0.6, 0.8, uv.x));
          col *= (0.75 + 0.5 * soft);

          float alpha = uOpacity * soft * fade;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    if (material?.uniforms?.uTime) material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[0, 0, -14]} scale={[30, 18, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// One hero planet (clean focal point) with subtle atmosphere glow
function Planet({ scroll = 0, activeSection = "intro" }) {
  const group = React.useRef();

  const baseColor = React.useMemo(() => new THREE.Color("#0b1226"), []);
  const glowColorA = React.useMemo(() => new THREE.Color("#06b6d4"), []);
  const glowColorB = React.useMemo(() => new THREE.Color("#7c3aed"), []);

  useFrame((state, dt) => {
    if (!group.current) return;

    // Slow spin only - no position changes
    group.current.rotation.y += dt * 0.08;
    
    // Keep planet in fixed position - no scroll or section-based movement
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.25;
    group.current.position.x = 0;
  });

  return (
    <group ref={group} position={[0, -0.4, -8]}>
      {/* Planet body */}
      <mesh>
        <sphereGeometry args={[1.25, 48, 48]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.9}
          metalness={0.05}
          emissive={new THREE.Color("#0a0e1a")}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={1.08}>
        <sphereGeometry args={[1.25, 48, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          emissive={activeSection === "software" ? glowColorA : glowColorB}
          emissiveIntensity={1.6}
          depthWrite={false}
        />
      </mesh>

      {/* Rim glow ring (very subtle) */}
      <mesh rotation={[Math.PI / 2.2, 0, 0]} scale={1.7}>
        <torusGeometry args={[1.05, 0.03, 16, 80]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          emissive={activeSection === "software" ? glowColorA : glowColorB}
          emissiveIntensity={2.0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Scene3D({ scrollProgress = 0, activeSection = "intro" }) {
  const { camera, gl } = useThree();
  const mouse = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouse.current.x = x;
      mouse.current.y = y;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state, dt) => {
    // Scroll drives a gentle “travel” feel (no jumpy changes)
    const travelY = -scrollProgress * 4.2;
    const travelZ = 8.2 - scrollProgress * 2.2;

    // Mouse parallax (subtle)
    const mx = mouse.current.x * 0.6;
    const my = mouse.current.y * 0.35;

    camera.position.x = damp(camera.position.x, mx, 5, dt);
    camera.position.y = damp(camera.position.y, travelY + my, 5, dt);
    camera.position.z = damp(camera.position.z, travelZ, 5, dt);

    camera.lookAt(0, travelY * 0.6, -9);

    // Crisp but not heavy
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  });

  return (
    <>
      <color attach="background" args={["#070a14"]} />
      <fog attach="fog" args={["#070a14", 10, 40]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 8, 6]} intensity={0.9} />
      <pointLight position={[-10, 2, -6]} intensity={1.2} color={"#7c3aed"} />
      <pointLight position={[10, -2, -6]} intensity={1.2} color={"#06b6d4"} />

      {/* Distant star field */}
      <Stars radius={260} depth={80} count={4200} factor={6} fade speed={0.35} />

      {/* Nebula + galaxy (procedural, clean) */}
      <NebulaPlane />
      <GalaxyPoints count={1900} radius={18} />

      {/* Single focal object that reacts to scroll & section */}
      <Planet scroll={scrollProgress} activeSection={activeSection} />
    </>
  );
}

function ScrollableScene({ activeSection }) {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      setScrollY(progress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 8.2], fov: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Scene3D scrollProgress={scrollY} activeSection={activeSection} />
    </Canvas>
  );
}
// ======= END CLEAN SPACE BACKGROUND =======


// // 3D Code Blocks - representing software engineering
// function CodeBlock({ position, rotation, color }) {
//   const meshRef = useRef();
  
//   useFrame((state) => {
//     if (meshRef.current) {
//       meshRef.current.rotation.y = rotation[1] + state.clock.elapsedTime * 0.2;
//     }
//   });

//   return (
//     <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
//       <group ref={meshRef} position={position} rotation={rotation}>
//         {/* Code block base */}
//         <mesh>
//           <boxGeometry args={[1.2, 0.8, 0.3]} />
//           <meshStandardMaterial 
//             color={color}
//             emissive={color}
//             emissiveIntensity={0.4}
//             metalness={0.7}
//             roughness={0.3}
//           />
//         </mesh>
//         {/* Code lines */}
//         {[0, 1, 2, 3].map((i) => (
//           <mesh key={i} position={[-0.4 + i * 0.25, 0, 0.16]}>
//             <boxGeometry args={[0.15, 0.05, 0.02]} />
//             <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
//           </mesh>
//         ))}
//       </group>
//     </Float>
//   );
// }

// // 3D Data Visualization - representing data science
// function DataVisualization({ position, color }) {
//   const groupRef = useRef();
  
//   useFrame((state) => {
//     if (groupRef.current) {
//       groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
//     }
//   });

//   // Generate data points
//   const points = [];
//   for (let i = 0; i < 20; i++) {
//     const angle = (i / 20) * Math.PI * 2;
//     const radius = 0.8;
//     points.push([
//       Math.cos(angle) * radius,
//       Math.sin(angle * 2) * 0.5,
//       Math.sin(angle) * radius
//     ]);
//   }

//   return (
//     <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
//       <group ref={groupRef} position={position}>
//         {/* Central sphere */}
//         <mesh>
//           <sphereGeometry args={[0.3, 16, 16]} />
//           <meshStandardMaterial 
//             color={color}
//             emissive={color}
//             emissiveIntensity={0.5}
//             metalness={0.8}
//             roughness={0.2}
//           />
//         </mesh>
//         {/* Data points */}
//         {points.map((point, i) => (
//           <mesh key={i} position={point}>
//             <sphereGeometry args={[0.05, 8, 8]} />
//             <meshStandardMaterial 
//               color={color}
//               emissive={color}
//               emissiveIntensity={1}
//             />
//           </mesh>
//         ))}
//         {/* Connecting lines */}
//         <line>
//           <bufferGeometry>
//             <bufferAttribute
//               attach="attributes-position"
//               count={points.length}
//               array={new Float32Array(points.flat())}
//               itemSize={3}
//             />
//           </bufferGeometry>
//           <lineBasicMaterial color={color} transparent opacity={0.3} />
//         </line>
//       </group>
//     </Float>
//   );
// }

// // 3D Network/Connection Nodes
// function NetworkNode({ position, color, delay = 0 }) {
//   const meshRef = useRef();
  
//   useFrame((state) => {
//     if (meshRef.current) {
//       const time = state.clock.elapsedTime + delay;
//       meshRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
//     }
//   });

//   return (
//     <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
//       <mesh ref={meshRef} position={position}>
//         <sphereGeometry args={[0.15, 16, 16]} />
//         <meshStandardMaterial 
//           color={color}
//           emissive={color}
//           emissiveIntensity={0.6}
//           transparent
//           opacity={0.8}
//         />
//       </mesh>
//     </Float>
//   );
// }

// // Interactive 3D Particles with gradient
// function Particles({ count = 200, color = "#06b6d4" }) {
//   const mesh = useRef();
//   const light = useRef();
//   const particles = useRef([]);

//   useEffect(() => {
//     const positions = new Float32Array(count * 3);
//     particles.current = [];
    
//     for (let i = 0; i < count; i++) {
//       const i3 = i * 3;
//       positions[i3] = (Math.random() - 0.5) * 25;
//       positions[i3 + 1] = (Math.random() - 0.5) * 25;
//       positions[i3 + 2] = (Math.random() - 0.5) * 15;
      
//       particles.current.push({
//         speed: Math.random() * 0.015 + 0.005,
//         startY: positions[i3 + 1]
//       });
//     }
    
//     if (mesh.current) {
//       mesh.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//     }
//   }, [count]);

//   useFrame((state) => {
//     if (mesh.current) {
//       const positions = mesh.current.geometry.attributes.position.array;
//       particles.current.forEach((particle, i) => {
//         const i3 = i * 3;
//         positions[i3 + 1] += particle.speed;
//         if (positions[i3 + 1] > 12) {
//           positions[i3 + 1] = particle.startY - 25;
//         }
//       });
//       mesh.current.geometry.attributes.position.needsUpdate = true;
//     }
//     if (light.current) {
//       light.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 6;
//       light.current.position.z = Math.cos(state.clock.elapsedTime * 0.5) * 6;
//     }
//   });

//   return (
//     <>
//       <pointLight ref={light} position={[5, 5, 5]} intensity={0.8} color={color} />
//       <points ref={mesh}>
//         <bufferGeometry />
//         <pointsMaterial size={0.12} color={color} transparent opacity={0.5} />
//       </points>
//     </>
//   );
// }

// // Main 3D Scene that responds to scroll and section
// function Scene3D({ scrollProgress = 0, activeSection = "intro" }) {
//   const groupRef = useRef();
//   const { camera } = useThree();
  
//   useFrame((state) => {
//     if (groupRef.current) {
//       // Subtle rotation based on scroll
//       groupRef.current.rotation.y = scrollProgress * 0.5;
//     }
    
//     // Camera movement based on section
//     if (activeSection === "software") {
//       camera.position.x = THREE.MathUtils.lerp(camera.position.x, 2, 0.05);
//     } else if (activeSection === "datascience") {
//       camera.position.x = THREE.MathUtils.lerp(camera.position.x, -2, 0.05);
//     } else {
//       camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.05);
//     }
//   });

//   const softwareColor = "#06b6d4";
//   const dataScienceColor = "#7c3aed";

//   return (
//     <>
//       <ambientLight intensity={0.3} />
//       <pointLight position={[10, 10, 10]} intensity={0.8} color={softwareColor} />
//       <pointLight position={[-10, 10, 10]} intensity={0.8} color={dataScienceColor} />
//       <directionalLight position={[0, 5, 5]} intensity={0.6} />
      
//       <Stars radius={300} depth={60} count={3000} factor={6} fade speed={0.5} />
      
//       <group ref={groupRef}>
//         {/* Software Engineering Elements - Right side */}
//         <CodeBlock position={[4, 2, -6]} rotation={[0, 0.5, 0]} color={softwareColor} />
//         <CodeBlock position={[5, -1, -8]} rotation={[0, -0.3, 0]} color={softwareColor} />
//         <NetworkNode position={[3, 3, -5]} color={softwareColor} delay={0} />
//         <NetworkNode position={[6, 0, -7]} color={softwareColor} delay={1} />
        
//         {/* Data Science Elements - Left side */}
//         <DataVisualization position={[-4, 2, -6]} color={dataScienceColor} />
//         <DataVisualization position={[-5, -1, -8]} color={dataScienceColor} />
//         <NetworkNode position={[-3, 3, -5]} color={dataScienceColor} delay={0.5} />
//         <NetworkNode position={[-6, 0, -7]} color={dataScienceColor} delay={1.5} />
//       </group>
      
//       <Particles count={200} color={activeSection === "software" ? softwareColor : dataScienceColor} />
//     </>
//   );
// }

// // Scroll-aware 3D Scene Wrapper
// function ScrollableScene({ activeSection }) {
//   const [scrollY, setScrollY] = useState(0);
  
//   useEffect(() => {
//     const handleScroll = () => {
//       const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
//       setScrollY(scrollProgress);
//     };
    
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   return (
//     <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
//       <Scene3D scrollProgress={scrollY} activeSection={activeSection} />
//     </Canvas>
//   );
// }

function Section({ id, children, className = "" }) {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="container">
        {children}
      </div>
    </section>
  );
}

function ProjectCard({ title, description, tech, link, github }) {
  return (
    <div className="projectCard">
      <div className="projectCardInner">
        <h3 className="projectTitle">{title}</h3>
        <p className="projectDescription">{description}</p>
        <div className="projectTech">
          {tech.map((t, i) => (
            <span key={i} className="techTag">{t}</span>
          ))}
        </div>
        <div className="projectLinks">
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="projectLink">
              Live Demo →
            </a>
          )}
          {github && (
            <a href={github} target="_blank" rel="noopener noreferrer" className="projectLink">
              GitHub →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("intro");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["intro", "software", "datascience", "contact"];
      const scrollPos = window.scrollY + window.innerHeight / 2;
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("Sending...");
    
    // Replace with your email service (EmailJS, Formspree, etc.)
    // For now, using mailto as fallback
    const mailtoLink = `mailto:your-email@example.com?subject=Portfolio Contact from ${formData.name}&body=${encodeURIComponent(formData.message)}%0D%0A%0D%0AFrom: ${formData.email}`;
    window.location.href = mailtoLink;
    
    // Reset form
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => {
      setFormStatus("Message sent! I'll get back to you soon.");
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const softwareProjects = [
    {
      title: "E-Commerce Platform",
      description: "Full-stack e-commerce application with user authentication, payment processing, and admin dashboard.",
      tech: ["React", "Node.js", "MongoDB", "Stripe"],
      link: "#",
      github: "#"
    },
    {
      title: "Task Management App",
      description: "Collaborative task management tool with real-time updates, drag-and-drop functionality, and team collaboration features.",
      tech: ["React", "TypeScript", "Firebase", "Material-UI"],
      link: "#",
      github: "#"
    },
    {
      title: "Social Media Dashboard",
      description: "Analytics dashboard for social media metrics with data visualization and reporting features.",
      tech: ["Next.js", "Python", "PostgreSQL", "Chart.js"],
      link: "#",
      github: "#"
    }
  ];

  const dataScienceProjects = [
    {
      title: "Stock Price Prediction",
      description: "Machine learning model to predict stock prices using LSTM neural networks and historical market data.",
      tech: ["Python", "TensorFlow", "Pandas", "NumPy"],
      link: "#",
      github: "#"
    },
    {
      title: "Customer Segmentation Analysis",
      description: "Clustering analysis to segment customers based on purchasing behavior using K-means and PCA.",
      tech: ["Python", "scikit-learn", "Matplotlib", "Seaborn"],
      link: "#",
      github: "#"
    },
    {
      title: "Sentiment Analysis Tool",
      description: "NLP model for analyzing sentiment in customer reviews using transformer models and text classification.",
      tech: ["Python", "Hugging Face", "NLTK", "Streamlit"],
      link: "#",
      github: "#"
    }
  ];

  return (
    <div className="portfolio">
      {/* Fixed 3D Background */}
      <div className="canvasContainer">
        <ScrollableScene activeSection={activeSection} />
        <div className="vignette" />
      </div>


      {/* Navigation */}
      <nav className="nav">
        <div className="navContainer">
          <div className="logo" onClick={() => scrollToSection("intro")}>
            AS
          </div>
          <div className="navLinks">
            <button 
              className={activeSection === "intro" ? "navLink active" : "navLink"}
              onClick={() => scrollToSection("intro")}
            >
              About
            </button>
            <button 
              className={activeSection === "software" ? "navLink active" : "navLink"}
              onClick={() => scrollToSection("software")}
            >
              Software
            </button>
            <button 
              className={activeSection === "datascience" ? "navLink active" : "navLink"}
              onClick={() => scrollToSection("datascience")}
            >
              Data Science
            </button>
            <button 
              className={activeSection === "contact" ? "navLink active" : "navLink"}
              onClick={() => scrollToSection("contact")}
            >
              Contact
            </button>
          </div>
        </div>
      </nav>

      {/* Introduction Section */}
      <Section id="intro" className="introSection">
        <div className="introContent">
          <h1 className="introTitle">
            Hi, I'm <span className="highlight">Asrith</span>
          </h1>
          <p className="introSubtitle">Software Engineer & Data Scientist</p>
          <p className="introText">
            I'm a passionate developer with expertise in building scalable web applications 
            and creating data-driven solutions. I love turning complex problems into simple, 
            beautiful, and intuitive solutions.
          </p>
          <div className="introStats">
            <div className="stat">
              <div className="statNumber">10+</div>
              <div className="statLabel">Projects</div>
            </div>
            <div className="stat">
              <div className="statNumber">5+</div>
              <div className="statLabel">Technologies</div>
            </div>
            <div className="stat">
              <div className="statNumber">2+</div>
              <div className="statLabel">Years Experience</div>
            </div>
          </div>
          <div className="introButtons">
            <button onClick={() => scrollToSection("software")} className="btn btnPrimary">View Projects</button>
            <button onClick={() => scrollToSection("contact")} className="btn btnSecondary">Get In Touch</button>
          </div>
        </div>
      </Section>

      {/* Software Engineering Projects */}
      <Section id="software" className="projectsSection">
        <div className="constructionWrapper">
          <div className="constructionOverlay">
            <div className="constructionTape">
              <div className="tapePattern"></div>
              <span className="tapeText">UNDER CONSTRUCTION</span>
              <div className="tapePattern"></div>
            </div>
            <div className="constructionContent">
              <h2 className="constructionTitle">Software Engineering Projects</h2>
              <p className="constructionSubtitle">Building scalable and efficient web applications</p>
              <p className="constructionMessage">More projects coming soon...</p>
            </div>
          </div>
          <div className="blurredContent">
            <h2 className="sectionTitle">Software Engineering Projects</h2>
            <p className="sectionSubtitle">Building scalable and efficient web applications</p>
            <div className="projectsGrid">
              {softwareProjects.map((project, i) => (
                <ProjectCard key={i} {...project} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Data Science Projects */}
      <Section id="datascience" className="projectsSection">
        <h2 className="sectionTitle">Data Science Projects</h2>
        <p className="sectionSubtitle">Transforming data into actionable insights</p>
        <div className="projectsGrid">
          {dataScienceProjects.map((project, i) => (
            <ProjectCard key={i} {...project} />
          ))}
        </div>
      </Section>

      {/* Contact Section */}
      <Section id="contact" className="contactSection">
        <div className="contactContent">
          <h2 className="sectionTitle">Get In Touch</h2>
          <p className="sectionSubtitle">Have a project in mind? Let's work together!</p>
          
          <form className="contactForm" onSubmit={handleSubmit}>
            <div className="formGroup">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>
            
            <div className="formGroup">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className="formGroup">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Tell me about your project..."
              />
            </div>
            
            <button type="submit" className="btn btnPrimary submitBtn">
              Send Message
            </button>
            
            {formStatus && (
              <p className="formStatus">{formStatus}</p>
            )}
          </form>
        </div>
      </Section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2024 Asrith. Built with React & Three.js</p>
        </div>
      </footer>
    </div>
  );
}
