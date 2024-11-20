import * as THREE from "three"
import { useMemo } from "react"

function useShaderMaterial({ vertexShader, fragmentShader }) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        uniforms: {
          uCamPos: { value: new THREE.Vector3() },
          uCamToWorldMat: { value: new THREE.Matrix4() },
          uCamInverseProjMat: { value: new THREE.Matrix4() },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2() },
          uResolution: { value: new THREE.Vector2() },
          uTexture: { value: null },
          uNoiseTexture: { value: null },
          iChannel0: { value: null },
          uSpeed: { value: 0.5 },
          uIOR: { value: 0.84 },
          uCount: { value: 3 },
          uReflection: { value: 1.5 },
          uSize: { value: 0.005 },
          uDispersion: { value: 0.03 },
          uRefract: { value: 0.15 },
          uChromaticAberration: { value: 0.5 },
          uPointerSize: { value: 0.03 },
        },
      }),
    []
  )
}

export default useShaderMaterial
