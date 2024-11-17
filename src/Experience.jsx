import { OrbitControls, RoundedBox, useTexture } from "@react-three/drei"
import { } from "@react-three/fiber"


export default function Experience(){

  const normalMap = useTexture('./textures/waternormals.jpeg')

  return (
    <>
      <OrbitControls />       
        <RoundedBox
          radius={0.01}
          >
          <meshStandardMaterial 
            metalness={1}
            roughness={0.12}
            normalMap={ normalMap }
          />
       </RoundedBox>
    </>
  )}