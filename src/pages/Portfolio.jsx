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

function BlackHole({ activeSection = "intro" }) {
  const group = React.useRef();

  const diskMat = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, // Make visible from both sides
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uIntensity;

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
          return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
        }
        float fbm(vec2 p){
          float v = 0.0;
          float a = 0.55;
          for(int i=0;i<5;i++){
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        // Temperature-based color mapping (blackbody radiation)
        // Hotter = inner edge (white/blue), Cooler = outer edge (red/orange)
        vec3 temperatureToColor(float temp) {
          // temp: 0.0 (cool/outer) to 1.0 (hot/inner)
          // Map to realistic accretion disk colors
          if (temp > 0.85) {
            // Hottest: white-blue (inner edge, closest to event horizon)
            return mix(vec3(0.9, 0.95, 1.0), vec3(0.7, 0.85, 1.0), (temp - 0.85) / 0.15);
          } else if (temp > 0.65) {
            // Hot: white-yellow
            return mix(vec3(1.0, 0.95, 0.8), vec3(0.9, 0.95, 1.0), (temp - 0.65) / 0.2);
          } else if (temp > 0.4) {
            // Medium: yellow-orange
            return mix(vec3(1.0, 0.7, 0.3), vec3(1.0, 0.95, 0.8), (temp - 0.4) / 0.25);
          } else {
            // Cool: orange-red (outer edge)
            return mix(vec3(0.8, 0.2, 0.1), vec3(1.0, 0.7, 0.3), temp / 0.4);
          }
        }

        void main(){
          // Make a ring in UV space
          vec2 uv = vUv * 2.0 - 1.0;
          float r = length(uv);

          // Ring mask (thin-ish donut)
          float inner = 0.35;
          float outer = 0.92;
          float ring = smoothstep(inner, inner+0.06, r) * (1.0 - smoothstep(outer-0.06, outer, r));

          // Swirl coordinates
          float ang = atan(uv.y, uv.x);
          float swirl = ang + uTime * 1.2 + r * 2.6;

          // Turbulence + streaking
          vec2 p = vec2(swirl * 0.35, r * 3.0);
          float n = fbm(p + vec2(uTime * 0.15, -uTime * 0.08));
          float streaks = smoothstep(0.45, 0.95, n);

          // Temperature: hottest at inner edge (r near inner), coolest at outer edge
          // Invert so inner = hot (1.0), outer = cool (0.0)
          float temp = 1.0 - clamp((r - inner) / (outer - inner), 0.0, 1.0);
          
          // Add some variation from turbulence
          temp = clamp(temp + (n - 0.5) * 0.15, 0.0, 1.0);

          // Get realistic color from temperature
          vec3 col = temperatureToColor(temp);
          
          // Brightness: strongest near inner edge, modulated by streaks
          float brightness = (0.4 + 1.6 * temp) * (0.7 + 0.6 * streaks);
          col *= brightness;

          // Fade + alpha
          float alpha = ring * (0.15 + 0.85 * temp) * uIntensity;

          // Make outer edge softer
          alpha *= smoothstep(1.05, 0.6, r);

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, []);

  useFrame((state, dt) => {
    if (!group.current) return;

    // Subtle float + slow spin
    group.current.rotation.y += dt * 0.18;
    group.current.rotation.z -= dt * 0.06;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.18;

    // Drive disk shader time
    diskMat.uniforms.uTime.value = state.clock.elapsedTime;
    diskMat.uniforms.uIntensity.value = 1.0;
  });

  return (
    <group ref={group} position={[0, -0.15, -8.4]}>
      {/* Event horizon (pure black) */}
      <mesh>
        <sphereGeometry args={[0.75, 48, 48]} />
        <meshStandardMaterial color="#000000" roughness={1} metalness={0} />
      </mesh>

      {/* Photon ring / lens glow */}
      <mesh scale={1.12}>
        <torusGeometry args={[0.78, 0.055, 24, 120]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.10}
          emissive={new THREE.Color("#7c3aed")}
          emissiveIntensity={2.2}
          depthWrite={false}
        />
      </mesh>

      {/* Accretion disk (tilted ring with shader) - visible from all angles */}
      <mesh rotation={[Math.PI / 2.2, 0.25, 0.1]} scale={2.25}>
        <ringGeometry args={[0.18, 1.0, 256]} />
        <primitive object={diskMat} attach="material" />
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
      <BlackHole activeSection={activeSection} /> 
    </>
  );
}

export function ScrollableScene({ activeSection }) {
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
  const [showEducationDetails, setShowEducationDetails] = useState(false);
  const [showAboutOverlay, setShowAboutOverlay] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formStatus, setFormStatus] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "intro",
        "education",
        "skills",
        "experience",
        "software",
        "datascience",
        "contact",
      ];
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("Sending...");

    const mailtoLink = `mailto:your-email@example.com?subject=Portfolio Contact from ${formData.name}&body=${encodeURIComponent(
      formData.message
    )}%0D%0A%0D%0AFrom: ${formData.email}`;
    window.location.href = mailtoLink;

    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setFormStatus("Message sent! I'll get back to you soon."), 1000);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- Data (edit these later) ---
  const education = {
    school: "University of Michigan — Ann Arbor",
    degree: "B.S. Data Science (LSA) + Intended Business Minor",
    gpa: "4.0",
    coursework: [
      "EECS 280/281 (Data Structures & Algorithms)",
      "STATS 413 (Applied Regression Analysis)",
      "DATASCI 315 (Deep Learning)",
    ],
    details:
      "Example details page content: Here you can add awards, clubs (MDST, IOE), key coursework highlights, and links to transcripts or syllabi later.",
  };

  const skills = {
    languages: ["Python", "C++", "JavaScript/TypeScript", "SQL"],
    frameworks: ["React", "Node.js", "Express", "Next.js"],
    data: ["Pandas", "NumPy", "scikit-learn", "TensorFlow", "PyTorch"],
    tools: ["Git", "Docker", "Tableau", "Netlify", "Linux"],
  };

  // Experience cards (use same layout as your project cards)
  const experiences = [
    {
      title: "Business Intelligence Tool",
      description:
        "Built sentiment dashboards using Streamlit, turning chatbot logs into actionable insights and surfacing key trends for stakeholders.",
      tech: ["Python", "Streamlit", "NLP", "Dashboards"],
      link: "#",
      github: "#",
    },
    {
      title: "Tech Chair — Iota Omega Epsilon",
      description:
        "Owned fraternity web infrastructure and deployments; improved UX, maintained content pipelines, and shipped updates reliably.",
      tech: ["React", "Netlify", "Git", "UI/UX"],
      link: "#",
      github: "#",
    },
    {
      title: "Cyclist Style Classifier (Team Project)",
      description:
        "Clustered bicyclists by riding style to generate personalized training insights and similarity-based recommendations.",
      tech: ["Python", "Clustering", "Feature Eng", "Evaluation"],
      link: "#",
      github: "#",
    },
  ];

  const softwareProjects = [
    {
      title: "E-Commerce Platform",
      description:
        "Full-stack e-commerce application with user authentication, payment processing, and admin dashboard.",
      tech: ["React", "Node.js", "MongoDB", "Stripe"],
      link: "#",
      github: "#",
    },
    {
      title: "Task Management App",
      description:
        "Collaborative task management tool with real-time updates, drag-and-drop functionality, and team collaboration features.",
      tech: ["React", "TypeScript", "Firebase", "Material-UI"],
      link: "#",
      github: "#",
    },
    {
      title: "Social Media Dashboard",
      description:
        "Analytics dashboard for social media metrics with data visualization and reporting features.",
      tech: ["Next.js", "Python", "PostgreSQL", "Chart.js"],
      link: "#",
      github: "#",
    },
  ];

  const dataScienceProjects = [
    {
      title: "Stock Price Prediction",
      description:
        "Machine learning model to predict stock prices using LSTM neural networks and historical market data.",
      tech: ["Python", "TensorFlow", "Pandas", "NumPy"],
      link: "#",
      github: "#",
    },
    {
      title: "Customer Segmentation Analysis",
      description:
        "Clustering analysis to segment customers based on purchasing behavior using K-means and PCA.",
      tech: ["Python", "scikit-learn", "Matplotlib", "Seaborn"],
      link: "#",
      github: "#",
    },
    {
      title: "Sentiment Analysis Tool",
      description:
        "NLP model for analyzing sentiment in customer reviews using transformer models and text classification.",
      tech: ["Python", "Hugging Face", "NLTK", "Streamlit"],
      link: "#",
      github: "#",
    },
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
              className={activeSection === "education" ? "navLink active" : "navLink"}
              onClick={() => scrollToSection("education")}
            >
              Education
            </button>
            <button
              className={activeSection === "skills" ? "navLink active" : "navLink"}
              onClick={() => scrollToSection("skills")}
            >
              Skills
            </button>
            <button
              className={activeSection === "experience" ? "navLink active" : "navLink"}
              onClick={() => scrollToSection("experience")}
            >
              Experience
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

      {/* Intro (same vibe) */}
      <Section id="intro" className="introSection">
        <div className="introContent">
          <h1 className="introTitle">
            I'm <span className="highlight">Asrith</span>
          </h1>
          <p className="introSubtitle">Data Scientist & Software Engineer</p>
          {/* <p className="introText">
            I'm a passionate developer with expertise in building scalable web applications and creating
            data-driven solutions. I love turning complex problems into simple, beautiful, and intuitive solutions.
          </p> */}

          <div className="introButtons">
            <button onClick={() => setShowAboutOverlay(true)} className="btn btnPrimary">
              More About Me
            </button>
            <button onClick={() => scrollToSection("contact")} className="btn btnSecondary">
              Get In Touch
            </button>
          </div>
        </div>
      </Section>

      {/* Education */}
      <Section id="education" className="projectsSection">
        <h2 className="sectionTitle">Education</h2>
        <p className="sectionSubtitle">Academic foundation and core coursework</p>

        <div className="projectsGrid">
          <div className="projectCard eduCard">
            <div className="projectCardInner">
              <div className="eduHeader">
                <h3 className="projectTitle">{education.school}</h3>
                <div className="eduMeta">
                  <span className="eduDegree">{education.degree}</span>
                  <span className="eduGpa">GPA: {education.gpa}</span>
                </div>
              </div>

              <div className="eduCoursework">
                {education.coursework.map((c, i) => (
                  <span key={i} className="techTag">
                    {c}
                  </span>
                ))}
              </div>

              <div className="projectLinks">
                <button
                  className="projectLink"
                  onClick={() => setShowEducationDetails((v) => !v)}
                  type="button"
                >
                  {showEducationDetails ? "Hide Details →" : "View Details →"}
                </button>
              </div>

              {showEducationDetails && (
                <div className="eduDetails">
                  <p className="projectDescription">{education.details}</p>

                  <div className="eduDetailsBox">
                    <div className="eduDetailsTitle">Example “Details Page” (placeholder)</div>
                    <p className="eduDetailsText">
                      Later you can replace this with a real route/page. For now it demonstrates expanded content:
                      awards, activities, relevant class projects, and links.
                    </p>
                    <div className="eduDetailsLinks">
                      <a className="projectLink" href="#" onClick={(e) => e.preventDefault()}>
                        Transcript (placeholder) →
                      </a>
                      <a className="projectLink" href="#" onClick={(e) => e.preventDefault()}>
                        Coursework Notes (placeholder) →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Technical Skills */}
      <Section id="skills" className="projectsSection">
        <h2 className="sectionTitle">Technical Skills</h2>
        <p className="sectionSubtitle">Tools I use to ship products and build models</p>

        <div className="skillsGrid">
          <div className="projectCard">
            <div className="projectCardInner">
              <h3 className="projectTitle">Languages</h3>
              <div className="projectTech">
                {skills.languages.map((s, i) => (
                  <span key={i} className="techTag">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="projectCard">
            <div className="projectCardInner">
              <h3 className="projectTitle">Frameworks</h3>
              <div className="projectTech">
                {skills.frameworks.map((s, i) => (
                  <span key={i} className="techTag">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="projectCard">
            <div className="projectCardInner">
              <h3 className="projectTitle">Data / ML</h3>
              <div className="projectTech">
                {skills.data.map((s, i) => (
                  <span key={i} className="techTag">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="projectCard">
            <div className="projectCardInner">
              <h3 className="projectTitle">Tools</h3>
              <div className="projectTech">
                {skills.tools.map((s, i) => (
                  <span key={i} className="techTag">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Experience (same layout as projects) */}
      <Section id="experience" className="projectsSection">
        <h2 className="sectionTitle">Experience</h2>
        <p className="sectionSubtitle">What I’ve built and shipped in real environments</p>
        <div className="projectsGrid">
          {experiences.map((exp, i) => (
            <ProjectCard key={i} {...exp} />
          ))}
        </div>
      </Section>

      {/* Software Engineering Projects (same as now) */}
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

      {/* Data Science Projects (same as now) */}
      <Section id="datascience" className="projectsSection">
        <h2 className="sectionTitle">Data Science Projects</h2>
        <p className="sectionSubtitle">Transforming data into actionable insights</p>
        <div className="projectsGrid">
          {dataScienceProjects.map((project, i) => (
            <ProjectCard key={i} {...project} />
          ))}
        </div>
      </Section>

      {/* Contact (same as now) */}
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

            {formStatus && <p className="formStatus">{formStatus}</p>}
          </form>
        </div>
      </Section>

      <footer className="footer">
        <div className="container">
          <p>© 2024 Asrith. Built with React & Three.js</p>
        </div>
      </footer>

      {/* About Overlay Modal */}
      {showAboutOverlay && (
        <div className="aboutOverlay" onClick={() => setShowAboutOverlay(false)}>
          <div className="aboutOverlayContent" onClick={(e) => e.stopPropagation()}>
            <button 
              className="aboutOverlayClose" 
              onClick={() => setShowAboutOverlay(false)}
              aria-label="Close"
            >
              ×
            </button>
            
            <div className="aboutOverlayBody">
              {/* Photo Section */}
              <div className="aboutPhotoSection">
                <div className="aboutPhotoPlaceholder">
                  <p className="aboutPhotoText">Photo Placeholder</p>
                  <p className="aboutPhotoSubtext">Add your photo(s) here</p>
                </div>
                {/* Future: Add photo collage here */}
              </div>

              {/* Description Section */}
              <div className="aboutDescriptionSection">
                <h2 className="aboutOverlayTitle">More About Me</h2>
                <div className="aboutDescriptionPlaceholder">
                  <p className="aboutDescriptionText">
                    Add your longer description here. This is where you can share more about your background, 
                    interests, passions, and what drives you. You can write multiple paragraphs and format 
                    the text however you'd like.
                  </p>
                  <p className="aboutDescriptionText">
                    This section is ready for you to customize with your own content. Talk about your journey, 
                    your values, what you're passionate about, or anything else you'd like visitors to know about you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
