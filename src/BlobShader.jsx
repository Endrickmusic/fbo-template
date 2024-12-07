import React, { useRef, useMemo, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useCubeTexture, useTexture } from "@react-three/drei"
import { useControls } from "leva"
import * as THREE from "three"
import { Perf } from "r3f-perf"
import vertexShader from "./shaders/vertexShader.js"
import fragmentShader from "./shaders/fragmentShader.js"
import useShaderMaterial from "./hooks/useShaderMaterial.jsx"

// Separate controls configuration for better readability
const SHADER_CONTROLS = {
  reflection: { value: 1.5, min: 0.01, max: 6.0, step: 0.1 },
  speed: { value: 0.5, min: 0.01, max: 3.0, step: 0.01 },
  IOR: { value: 0.84, min: 0.01, max: 1.0, step: 0.01 },
  count: { value: 3, min: 1, max: 20, step: 1 },
  size: { value: 0.15, min: 0.001, max: 0.5, step: 0.001 },
  dispersion: { value: 0.03, min: 0.0, max: 0.1, step: 0.001 },
  refract: { value: 0.15, min: 0.0, max: 2.0, step: 0.1 },
  chromaticAberration: {
    value: 0.5,
    min: 0.0,
    max: 5.0,
    step: 0.1,
    label: "Chromatic Aberration",
  },
  pointerSize: { value: 0.3, min: 0.01, max: 4.2, step: 0.01 },
  noiseScale: {
    value: 0.4,
    min: 0.002,
    max: 1.0,
    step: 0.001,
    label: "Noise Scale",
  },
  noiseAmount: {
    value: 0.2,
    min: 0.0,
    max: 2.0,
    step: 0.01,
    label: "Noise Amount",
  },
}

export default function BlobShader({ map }) {
  const meshRef = useRef()
  const mousePosition = useRef({ x: 0, y: 0 })
  const { viewport, camera, gl } = useThree()

  const shaderMaterial = useShaderMaterial({ vertexShader, fragmentShader })
  const controls = useControls(SHADER_CONTROLS)

  // Memoized calculations
  const { nearPlaneWidth, nearPlaneHeight } = useMemo(() => {
    const width =
      camera.near *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
      camera.aspect *
      2
    return {
      nearPlaneWidth: width,
      nearPlaneHeight: width / camera.aspect,
    }
  }, [camera])

  // Memoized vectors and matrices
  const cameraForwardPos = useMemo(() => new THREE.Vector3(), [])

  // Load textures
  const noiseTexture = useTexture("./textures/uv_map_01.jpg", (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.minFilter = texture.magFilter = THREE.LinearFilter
  })

  const cubeTexture = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: "./cubemap/potsdamer_platz/" }
  )

  // Mouse movement handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosition.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      shaderMaterial.uniforms.uResolution.value
        .set(viewport.width, viewport.height)
        .multiplyScalar(Math.min(window.devicePixelRatio, 2))
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [viewport, shaderMaterial])

  // Update textures
  useEffect(() => {
    const { uniforms } = shaderMaterial
    uniforms.uTexture.value = map
    uniforms.uNoiseTexture.value = noiseTexture
    uniforms.iChannel0.value = cubeTexture
  }, [map, noiseTexture, cubeTexture, shaderMaterial])

  // Animation frame updates
  useFrame((state) => {
    const mesh = meshRef.current
    const { uniforms } = shaderMaterial

    // Update time-based and mouse uniforms
    uniforms.uTime.value = state.clock.getElapsedTime() * controls.speed
    uniforms.uMouse.value.set(mousePosition.current.x, mousePosition.current.y)

    // Update control-based uniforms
    Object.entries(controls).forEach(([key, value]) => {
      const uniformKey = `u${key.charAt(0).toUpperCase()}${key.slice(1)}`
      if (uniforms[uniformKey]) uniforms[uniformKey].value = value
    })

    // Update camera-related values
    camera
      .getWorldDirection(cameraForwardPos)
      .multiplyScalar(camera.near)
      .add(camera.position)

    mesh.position.copy(cameraForwardPos)
    mesh.rotation.copy(camera.rotation)
    mesh.scale.set(nearPlaneWidth, nearPlaneHeight, 1)

    // Update camera uniforms
    uniforms.uCamPos.value.copy(camera.position)
    uniforms.uCamToWorldMat.value.copy(camera.matrixWorld)
    uniforms.uCamInverseProjMat.value.copy(camera.projectionMatrixInverse)
  })

  return (
    <>
      <Perf position="top-left" minimal={false} className="stats" />
      <mesh ref={meshRef} scale={[nearPlaneWidth, nearPlaneHeight, 1]}>
        <planeGeometry args={[1, 1]} />
        <primitive object={shaderMaterial} />
      </mesh>
    </>
  )
}
