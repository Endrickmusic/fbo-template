import { OrbitControls, RoundedBox, useTexture } from "@react-three/drei"
import {} from "@react-three/fiber"

export default function Experience({ position }) {
  const normalMap = useTexture("./textures/waternormals.jpeg")

  return (
    <>
      <RoundedBox
        radius={0.01}
        rotation={[0, Math.PI / 4, Math.PI / 4]}
        position={position}
      >
        <meshStandardMaterial
          metalness={1}
          roughness={0.12}
          normalMap={normalMap}
        />
      </RoundedBox>
    </>
  )
}
