import { useRef, useMemo } from "react"
import { useFrame, useThree, createPortal } from "@react-three/fiber"
import { useFBO } from "@react-three/drei"
import * as THREE from "three"

import BlobShader from "./BlobShader.jsx"

export default function Buffer({ children }) {
  const planeRef = useRef()
  const buffer = useFBO()
  const { viewport, gl, camera } = useThree()

  const bufferScene = useMemo(() => new THREE.Scene(), [])

  useFrame(() => {
    gl.setRenderTarget(buffer)
    gl.render(bufferScene, camera)
    gl.setRenderTarget(null)
  })

  return (
    <>
      {createPortal(children, bufferScene)}
      <mesh ref={planeRef}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={buffer.texture} />
      </mesh>
      <BlobShader map={buffer.texture} />
    </>
  )
}
