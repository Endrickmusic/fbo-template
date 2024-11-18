import React, { useRef, useMemo, useEffect, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useCubeTexture, useTexture, useFBO } from "@react-three/drei"
import { useControls, Leva } from "leva"
import * as THREE from "three"
import { Perf } from "r3f-perf"
import vertexShader from "./shaders/vertexShader.js"
import fragmentShader from "./shaders/fragmentShader.js"
import useShaderMaterial from "./hooks/useShaderMaterial.jsx"

export default function BlobShader({ map }) {
  const meshRef = useRef()
  const buffer = useFBO()
  const { viewport, scene, camera, gl } = useThree()

  const shaderMaterial = useShaderMaterial({ vertexShader, fragmentShader })

  const mousePosition = useRef({ x: 0, y: 0 })

  const updateMousePosition = useCallback((e) => {
    const aspect = window.innerWidth / window.innerHeight
    mousePosition.current = {
      x: e.clientX / window.innerWidth,
      y: 1 - e.clientY / window.innerHeight,
    }
  }, [])

  const noiseTexture = useTexture("./textures/noise.png")

  const cubeTexture = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: "./cubemap/potsdamer_platz/" }
  )

  const controls = useControls({
    reflection: { value: 1.5, min: 0.01, max: 6.0, step: 0.1 },
    speed: { value: 0.5, min: 0.01, max: 3.0, step: 0.01 },
    IOR: { value: 0.84, min: 0.01, max: 1.0, step: 0.01 },
    count: { value: 3, min: 1, max: 20, step: 1 },
    size: { value: 0.005, min: 0.001, max: 0.5, step: 0.001 },
    dispersion: { value: 0.03, min: 0.0, max: 0.1, step: 0.001 },
    refract: { value: 0.15, min: 0.0, max: 2.0, step: 0.1 },
    chromaticAberration: { value: 0.5, min: 0.0, max: 5.0, step: 0.1 },
    pointerSize: { value: 0.3, min: 0.01, max: 4.2, step: 0.01 },
  })

  useEffect(() => {
    window.addEventListener("mousemove", updateMousePosition, false)
    return () => {
      window.removeEventListener("mousemove", updateMousePosition, false)
    }
  }, [updateMousePosition])

  useEffect(() => {
    const handleResize = () => {
      shaderMaterial.uniforms.uResolution.value
        .set(viewport.width, viewport.height)
        .multiplyScalar(Math.min(window.devicePixelRatio, 2))
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [viewport])

  const cameraForwardPos = useMemo(() => new THREE.Vector3(), [])
  const mouseVector = useMemo(() => new THREE.Vector2(), [])

  useFrame((state) => {
    const { current: mesh } = meshRef
    const { uniforms } = shaderMaterial

    const time = state.clock.getElapsedTime() * controls.speed
    uniforms.uTime.value = time
    uniforms.uMouse.value.set(mousePosition.current.x, mousePosition.current.y)

    camera
      .getWorldDirection(cameraForwardPos)
      .multiplyScalar(camera.near)
      .add(camera.position)

    mesh.position.copy(cameraForwardPos)
    mesh.rotation.copy(camera.rotation)
    mesh.scale.set(nearPlaneWidth, nearPlaneHeight, 1)

    shaderMaterial.uniforms.uCamPos.value.copy(camera.position)
    shaderMaterial.uniforms.uCamToWorldMat.value.copy(camera.matrixWorld)
    shaderMaterial.uniforms.uCamInverseProjMat.value.copy(
      camera.projectionMatrixInverse
    )

    uniforms.uPointerSize.value = controls.pointerSize

    gl.setRenderTarget(buffer)
    gl.setClearColor("#d8d7d7")
    gl.render(scene, camera)
    gl.setRenderTarget(null)
  })

  useEffect(() => {
    shaderMaterial.uniforms.uTexture.value = map
    shaderMaterial.uniforms.uNoiseTexture.value = noiseTexture
    shaderMaterial.uniforms.iChannel0.value = cubeTexture
  }, [map, noiseTexture, cubeTexture])

  const nearPlaneWidth = useMemo(
    () =>
      camera.near *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
      camera.aspect *
      2,
    [camera, viewport]
  )
  const nearPlaneHeight = useMemo(
    () => nearPlaneWidth / camera.aspect,
    [nearPlaneWidth, camera, viewport]
  )

  return (
    <>
      <Perf position="top-left" minimal={false} className="stats" />
      <Leva hidden />
      <mesh ref={meshRef} scale={[nearPlaneWidth, nearPlaneHeight, 1]}>
        <planeGeometry args={[1, 1]} />
        <primitive object={shaderMaterial} />
      </mesh>
    </>
  )
}
