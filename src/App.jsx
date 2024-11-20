import { useState } from "react"
import Logo from "/face-blowing-a-kiss.svg"
import { Canvas } from "@react-three/fiber"
import { Environment, ScrollControls, Scroll } from "@react-three/drei"
import { Leva } from "leva"

import Experience from "./Experience"
import Buffer from "./Buffer"

import "./index.css"

export default function App() {
  return (
    <>
      <Leva />
      <Canvas
        shadows
        camera={{
          position: [0, 0, 3],
          fov: 75,
          near: 0.1,
          far: 1000,
          aspect: window.innerWidth / window.innerHeight,
        }}
      >
        {/* <Buffer> */}
        <Environment files="./hdris/envmap.hdr" />
        <color attach="background" args={["#aaefef"]} />
        <ScrollControls pages={3} damping={0.1}>
          <Scroll>
            <Experience position={[0, 0, 0]} />
          </Scroll>
          <Scroll html>
            <div style={{ transform: "translate3d(65vw, 100vh, 0)" }}>
              Ich mache
              <br />
              alles für
              <br />
              ihr Geld.
              <br />
            </div>
            <div style={{ transform: "translate3d(15vw, 180vh, 0)" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </div>
          </Scroll>
          <Scroll>
            <Experience position={[0, -10, 0]} />
          </Scroll>
        </ScrollControls>
        {/* </Buffer> */}
      </Canvas>
    </>
  )
}
