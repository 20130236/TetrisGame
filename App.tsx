import React, {
  FunctionComponent,
  useEffect,
  useCallback,
  useState,
} from 'react';

import {Text,SafeAreaView, View, Button, ViewProps, 
  StatusBar, StyleSheet, Pressable, TouchableOpacity} from 'react-native';
import {EngineView, useEngine,FontFace  } from '@babylonjs/react-native';
import {Camera} from '@babylonjs/core/Cameras/camera';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/loaders/glTF';
import {Scene} from '@babylonjs/core/scene';
import {Vector3, HemisphericLight, MeshBuilder, Material, 
  Color4, PointerEventTypes, DynamicTexture, DirectionalLight, StandardMaterial, 
  FreeCamera, MirrorTexture, RefractionTexture, Plane,
  ActionManager,InterpolateValueAction, SetValueAction, PredicateCondition,CombineAction,
  KeyboardEventTypes,Axis,Space,ExecuteCodeAction,Mesh,Tools,AcquireNativeObjectAsync,
} from '@babylonjs/core';
import{AdvancedDynamicTexture,TextBlock,Line,Control} from "@babylonjs/gui";
import { GridMaterial } from '@babylonjs/materials';
import TBlock from './3DTetris/block/TBlock';
import Block from './3DTetris/block/Block';
import Game from './3DTetris/Game';
import { styleBtn } from './style';
import GameBoard from './3DTetris/GameBoard';
import LBlock from './3DTetris/block/LBlock';

const EngineScreen: FunctionComponent<ViewProps> = (props: ViewProps) => {
  const engine = useEngine();

  const [camera, setCamera] = useState<Camera>();
  const [scene, setScene] = useState<Scene>();
  const [game,setGame] = useState<Game>();
  const [gameBoard,setGameBoard] = useState<GameBoard>();
  const [gameOver,setGameOver] = useState<Boolean>(false);
  const [advancedTexture,setAdvancedTexture] = useState<AdvancedDynamicTexture>();
  
  useEffect(() => {
    if (engine) {
      
              const scene = new Scene(engine);
              setScene(scene);
              if(scene){
                   //setGameBoard(new GameBoard(3,scene));
                  //  new LBlock(scene);
                   
                  //  setInterval(() => {
                  //   var random = Math.floor(Math.random() * 3) + 1;

                  //  })
                  //Load .tiff font file
                  Tools.LoadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf", true).then(
                    (data: ArrayBuffer | string) => 
                    {
                      //Requires data to be ArrayBuffer
                      if (data instanceof ArrayBuffer) 
                      {
                        //native.Canvas.loadTTFAsync("droidsans", data);        
              
                        // GUI
                        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
                        
                        // Manually draw text in the AdvancedDynamicTexture using its context.
                        advancedTexture.onEndRenderObservable.add( () => 
                        {
                          var font = "110px droidsans";
                          var context = advancedTexture.getContext();
                          context.font = font;  
                          context.fillText("Press start",advancedTexture.getSize().width / 3, advancedTexture.getSize().height / 2);
                        });
                        setAdvancedTexture(advancedTexture);  
                      }
                    });
                    const fontFace = new FontFace('droidsans', 'https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf');
                    fontFace.load().then(() => {
                    const mat = new StandardMaterial('Name', scene);
                      const texture = new DynamicTexture('testText', { width: 256, height: 256 }, scene);
                      texture.drawText('TestText', 96, 128, '', 'black', 'white', true, true);
                      mat.diffuseTexture = texture;
                      // const plane = Mesh.CreatePlane('testPlane', 1, scene, true);
                      // plane.material = mat;
                      // plane.position.z = 2;
                      // plane.position.y -= 0.5;
                    });
                setUpScene(scene);
              }

              engine.runRenderLoop(() => {
                scene.render();
              });

              engine.runRenderLoop(() => {
                  //console.log("engine loop");
                  //scene.render();
                  // textBscene.render();
                  if (!(game?.gameOver)) {
                      //console.log("scene render");
                      scene.render();
                      //updateScore();
                  }
                  else if (game?.gameOver) {

                      console.log("gameOver");
                      //menu!._advancedTexture .dispose();
                      scene.clearColor = new Color4(0, 0, 0, 0);
                      drawGameOver();
                      scene.dispose();
                      var scene2 = new Scene(engine);
                      setScene(scene2);
                      setUpScene(scene2);
                      scene2.render();
                  }
              });
    };
    }
  , [engine]);

  function setUpScene(scene: Scene) {
    scene.createDefaultCamera(true, undefined, true);
    (scene.activeCamera as ArcRotateCamera).alpha += Math.PI;
    (scene.activeCamera as ArcRotateCamera).radius = 20;
    (scene.activeCamera as ArcRotateCamera).position = new Vector3(12, 12, -5);
    setCamera(scene.activeCamera!);

    var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 1;

  }

  function drawGameOver(){
    Tools.LoadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf", true).then(
                    (data: ArrayBuffer | string) => 
                    {
                      //Requires data to be ArrayBuffer
                      if (data instanceof ArrayBuffer) 
                      {
                        //native.Canvas.loadTTFAsync("droidsans", data);        
              
                        // GUI
                        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
                        
                        // Manually draw text in the AdvancedDynamicTexture using its context.
                        advancedTexture.onEndRenderObservable.add( () => 
                        {
                          var font = "110px droidsans";
                          var context = advancedTexture.getContext();
                          context.font = font;  
                          context.fillText("Game Over",advancedTexture.getSize().width / 3, advancedTexture.getSize().height / 2);
                        });
                        setAdvancedTexture(advancedTexture);  
                      }
                    });
                    const fontFace = new FontFace('droidsans', 'https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf');
                    fontFace.load().then(() => {
                    const mat = new StandardMaterial('Name', scene);
                      const texture = new DynamicTexture('testText', { width: 256, height: 256 }, scene);
                      texture.drawText('TestText', 96, 128, '', 'black', 'white', true, true);
                      mat.diffuseTexture = texture;
                      // const plane = Mesh.CreatePlane('testPlane', 1, scene, true);
                      // plane.material = mat;
                      // plane.position.z = 2;
                      // plane.position.y -= 0.5;
                    });

  }


  function left(){
    game?.enableControls("left");
    //arrow?.rotate("x",Math.PI/2);
  }

  function right(){
    game?.enableControls("right");
    //arrow?.rotate("x",Math.PI/2);
  }

  function forward(){
    game?.enableControls("forward");
    //arrow?.rotate("x",Math.PI/2);
  }

  function backWard(){
    game?.enableControls("backward");
    //arrow?.rotate("x",Math.PI/2);
  }

  function rotateX(){
    game?.enableControls("rotateX");
    //arrow?.rotate("x",Math.PI/2);
  }

  function rotateY(){
    game?.enableControls("rotateY");
    //arrow?.rotate("y",Math.PI/2);
  }

  function rotateZ(){
    game?.enableControls("rotateZ");
    //arrow?.rotate("z",Math.PI/2);
  }

  function down(){
    game?.enableControls("down");
    //arrow?.rotate("z",Math.PI/2);
  }

  function startGame(){
    if(game?.gameOver){
      scene?.dispose();
      var scene2 = new Scene(engine!);
      setScene(scene2);
      setUpScene(scene2);
      scene2.render();
      setGame(new Game(3, scene2!,false));
    } else {
      advancedTexture?.dispose();
      setGame(new Game(3, scene!,false));
    }
  }

  function startAI(){
    if(game?.gameOver){
      scene?.dispose();
      var scene2 = new Scene(engine!);
      setScene(scene2);
      setUpScene(scene2);
      scene2.render();
      setGame(new Game(3, scene2!,true));
    } else {
      advancedTexture?.dispose();
      setGame(new Game(3, scene!,true));
      //gameBoard
    }
  }
     
  return (
    <>
      <View style={props.style}>
        <View style={{flex: 5,}}>
          <EngineView camera={camera} displayFrameRate={true} />
        </View>
       
        <View style={{flex:2,display:"flex",flexDirection:"row"}}>
        
          <View style= {{flex:2,width:"50%"}}>
          <Pressable  style={[[styleBtn.container, styleBtn.containerLeftAligned]]}
          onPress={left}
          >
            <View style={[styleBtn.arrow, styleBtn.arrowLeftAligned]}>
              <Text>left</Text>
            </View>
          </Pressable>

          <Pressable style={[styleBtn.arrow, styleBtn.arrowTopAligned]}
            onPress={backWard}
          >
            <Text>top</Text>
          </Pressable>

          <Pressable style={[[styleBtn.container, styleBtn.containerRightAligned]]}
          onPress={right}>
            <View style={[styleBtn.arrow, styleBtn.arrowRightAligned]}>
              <Text>right</Text>
            </View>
          </Pressable>

          <Pressable style={[styleBtn.arrow, styleBtn.arrowBottomAligned]}
          onPress={forward}>
            <Text> and red</Text>
          </Pressable>
          </View>
          <View style= {{flex:2,width:"50%"}}>

          <View style={{width:"98%",display:"flex",
            justifyContent:"space-between",alignItems:"center",
            marginRight:"auto",marginBottom:20,
            marginLeft:"auto",flexDirection:"row"}}>
              <TouchableOpacity style={{width:"45%",marginTop: 15}}>
                <Button
                    onPress={rotateX}
                    title="Rx"
                    color="#841584"
                    accessibilityLabel="rotateX"
                  />

              </TouchableOpacity>
               
                <TouchableOpacity style={{width:"45%",marginTop: 15}}>
                <Button
                    onPress={down}
                    title="Down"
                    color="#841584"
                    accessibilityLabel="Down"
                  />

              </TouchableOpacity>
            </View>

            {/* <TouchableOpacity style={{width:"45%",  marginTop: 5, 
            marginRight:"auto", marginBottom:20,
            marginLeft:"auto",}}>
              <Button

                onPress={rotateX}
                title="Rx"
                color="#841584"
                accessibilityLabel="rotateX"
              /> 
            </TouchableOpacity>
            <TouchableOpacity style={{width:"45%",  marginTop: 5, 
            marginRight:"auto", marginBottom:20,
            marginLeft:"auto",}}>
              <Button

                onPress={down}
                title="Down"
                color="#841584"
                accessibilityLabel="Down"
              /> 
            </TouchableOpacity> */}
            <View style={{width:"98%",display:"flex",
            justifyContent:"space-between",alignItems:"center",
            marginRight:"auto",marginBottom:20,
            marginLeft:"auto",flexDirection:"row"}}>
              <TouchableOpacity style={{width:"45%"}}>
                <Button
                    onPress={rotateY}
                    title="Ry"
                    color="#841584"
                    accessibilityLabel="rotateY"
                  />

              </TouchableOpacity>
               
                <TouchableOpacity style={{width:"45%"}}>
                <Button
                    onPress={rotateZ}
                    title="Rz"
                    color="#841584"
                    accessibilityLabel="rotateY"
                  />

              </TouchableOpacity>
            </View>

            <View>
            {/* <Button
              onPress={down}
              title="Down"
              color="#841584"
              /> */}
            <View style={{width:"98%",display:"flex",
            justifyContent:"space-between",alignItems:"center",
            marginRight:"auto",marginBottom:20,
            marginLeft:"auto",flexDirection:"row"}}>
              <TouchableOpacity style={{width:"45%"}}>
                <Button
                  onPress={startGame}
                  title="Start"
                  color="#841584"
                  />

              </TouchableOpacity>
               
                <TouchableOpacity style={{width:"45%"}}>
                <Button
                  onPress={startAI}
                  title="Run AI"
                  color="#841584"
                  />

              </TouchableOpacity>
            </View>      
            </View>
           
          </View>
        </View>
        
      </View>
    </>
  );
};

const App = () => {
  
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{flex: 2, backgroundColor: 'white'}}>
        <EngineScreen style={{flex: 1}} />       
      </SafeAreaView>
    </>
  );
};


export default App;

