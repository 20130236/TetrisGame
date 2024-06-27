import {Vector3, HemisphericLight, MeshBuilder, Material, 
    Color3, ShadowGenerator, PointLight, DirectionalLight, StandardMaterial, 
    FreeCamera, MirrorTexture, RefractionTexture, Plane,Tools,
    ActionManager,InterpolateValueAction, SetValueAction, PredicateCondition,Scene,Mesh,Color4,Axis,Space,
  } from '@babylonjs/core';
import{AdvancedDynamicTexture,TextBlock,Line,Control} from "@babylonjs/gui";
import GameBoard from './GameBoard';
import Block from './block/Block';
import TBlock from './block/TBlock';
import _ from 'lodash';
import LBlock from './block/LBlock';
import ZBlock from './block/ZBlock';
import Cube from './block/Cube';
import IBlock from './block/IBlock';

class Game {
    public gameBoard: GameBoard;
    public block!: Block; 
    public collided: boolean;
    private _landed: Mesh[]; // mảng chứa các block đã chạm đáy
    private _rotation: number;
    public fallingInterval: any;
    public scene: Scene;
    public gameOver: boolean;
    public scoreCount: number; 
    private cloneBlock!: Block;
    private dummy!: Block;
    private cloneSpaces!: any[];
    private advancedTexture! : AdvancedDynamicTexture
    public gameOverAdvancedTexture! : AdvancedDynamicTexture
    private isAiActive: boolean;
    private findBestMove: boolean;

    constructor(size: number, scene: Scene, isAiActive:boolean) {
        this.scene = scene;
        this.gameBoard = new GameBoard(size, scene); //7 or 5
        this.collided = false;
        this._landed = new Array();
        this._rotation = Math.PI / 2;
        this.gameOver = false;
        this.scoreCount = 0;
        this.isAiActive = isAiActive;
        this.findBestMove = false;


        Tools.LoadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf", true).then(
                    (data: ArrayBuffer | string) => 
                    {
    
                      if (data instanceof ArrayBuffer) 
                      {
        
                        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Score", true, scene);
                        
                       
                        this.advancedTexture.onEndRenderObservable.add( () => 
                        {
                          var font = "70px droidsans";
                          var context = this.advancedTexture.getContext();
                          context.font = font;  
                          context.fillText("Score: " + this.scoreCount,75, 135);
                        });
                        //setScoreAdvancedTexture(advancedTexture);  
                      }
                    });

        this.drawBlock();

        scene.registerBeforeRender(() => {
            if (this.gameOver) {
                clearInterval(this.fallingInterval);
                this.drawGameOver();
            }
            
            if (this.collided) {
                console.log("collided");
                clearInterval(this.fallingInterval);
                this.setLanded();
                this.checkFullLayer();
                //console.log(this.gameBoard.spaces);
                if (!this.isGameOver()) {
                    this.collided = false;
                    this.drawBlock();
                }
            } 
        });
    }

    public drawBlock() { 
        if(this.isAiActive){
            this.findBestMove = true;
        } 

        var random = Math.floor(Math.random() * 3);

        //random = 1;
        switch(random) {
            // case 0:
            //     this.block = new Cube(this.scene);
            //     break;
            case 1:
                this.block = new LBlock(this.scene);
                break;
            case 2:
                this.block = new TBlock(this.scene); 
                break;
            case 0:
                this.block = new ZBlock(this.scene); 
                break;
            // case 4:
            //     this.block = new IBlock(this.scene); 
            //     break;
        }
        this.checkCollision();
       
        this.fallingInterval = setInterval(() => { 
            if (!this.gameBoard.inGrid(this.block.getPositions()) && 
            !this.gameBoard.canMoveWhenOutGrid(this.block.getPositions(), "down")) {
                console.log("gameOver");
                this.gameOver = true;
                return;
            }
            
            if (this.gameBoard.inGrid(this.block.getPositions()) === false) { // trên đầu gameboard vẫn cho block rơi xuống
                this.block.position.y -= 1;
                this.scene.render();
                this.fixRotationOffset();
            }
            else if (this.gameBoard.inGrid(this.block.getPositions()) && this.gameBoard.canMove(this.block.getPositions(), "down") === false) {
                this.collided = true;
                //console.log("in cant move and in grid");  
            } 
            else if (this.gameBoard.inGrid(this.block.getPositions()) && this.checkCollision() === false && this.gameBoard.canMove(this.block.getPositions(), "down")) {
                this.block.position.y -= 1;
                this.scene.render();
                this.fixRotationOffset();
                    // this.block.rotate("x",this._rotation);
                    // this.scene.render();
                    // this.fixRotationOffset();
                //this.gameBoard.updateSpaces(this.block.getPositions(), true, false);
            }
            if(this.gameBoard.inGrid(this.block.getPositions()) && this.isAiActive && this.findBestMove){
                this.bestMove();
            }
            //console.log("canMoveDown?" + this.gameBoard.canMove(this.block.getPositions(), "down"));
            //console.log(this.gameBoard.spaces);
        }, 1250); //1500    
    }

    private fixRotationOffset(): void { 
        // sau khi rotate cubeParent làm cho các cube con lưu trữ các giá trị  số vô tỷ 
        // làm tròn lại các giá trị của position
        var fixpos = this.block.getPositions();
        for (var i = 0; i < fixpos.length; i++) {
            if (Math.abs(fixpos[i].x) > 0 && Math.abs(fixpos[i].x) < 0.1) { 
                fixpos[i].x = Math.floor(Math.abs(fixpos[i].x));       
            }
            if (Math.abs(fixpos[i].y) > 0 && Math.abs(fixpos[i].y) < 0.1) {
                fixpos[i].y = Math.floor(Math.abs(fixpos[i].y));
            }
            if (Math.abs(fixpos[i].z) > 0 && Math.abs(fixpos[i].z) < 0.1) {
                fixpos[i].z = Math.floor(Math.abs(fixpos[i].z));
            }
        }
    }

    private fixRelPosOffSet(): void{
        var fixpos = this.block.getRelPos();
        for (var i = 0; i < fixpos.length; i++) {
            if (Math.abs(fixpos[i].x) > 0 && Math.abs(fixpos[i].x) < 0.1) { 
                fixpos[i].x = Math.floor(Math.abs(fixpos[i].x));
            }
            if (Math.abs(fixpos[i].y) > 0 && Math.abs(fixpos[i].y) < 0.1) {
                fixpos[i].y = Math.floor(Math.abs(fixpos[i].y));
            }
            if (Math.abs(fixpos[i].z) > 0 && Math.abs(fixpos[i].z) < 0.1) {
                fixpos[i].z = Math.floor(Math.abs(fixpos[i].z));
            }
        }
    }

    private fixOffSetCloneBlock(): void{
        var fixpos = this.cloneBlock.getRelPos();
        //console.log("fix",fixpos);
        for (var i = 0; i < fixpos.length; i++) {
            if (Math.abs(fixpos[i].x) > 0 && Math.abs(fixpos[i].x) < 0.1) { 
                // console.log(this.block.getPositions());  
                // console.log("fixing rotation x", fixpos[i].x);
                // fixpos[i].x = 0;
                fixpos[i].x = Math.floor(Math.abs(fixpos[i].x));
                
                // console.log("fixed", fixpos[i].x);
                // console.log(this.block.getPositions());
            }
            if (Math.abs(fixpos[i].y) > 0 && Math.abs(fixpos[i].y) < 0.1) {
                // console.log(this.block.getPositions());
                // console.log("fixing rotation y", fixpos[i].y);
                // fixpos[i].y = 0;
                fixpos[i].y = Math.floor(Math.abs(fixpos[i].y));

                    //console.log("fixed", fixpos[i].y);
                // console.log(this.block.getPositions());
            }
            if (Math.abs(fixpos[i].z) > 0 && Math.abs(fixpos[i].z) < 0.1) {
                // console.log(this.block.getPositions());
                // console.log("fixing rotation z", fixpos[i].z);
                // fixpos[i].z = 0;
                fixpos[i].z = Math.floor(Math.abs(fixpos[i].z));

                    //console.log("fixed", fixpos[i].z);
                // console.log(this.block.getPositions());
            }
        }
    }

    private checkCollision(): boolean { 
        // check vị trí từng cube của block kiểm tra xem vị trị y = y của đáy
        // = thì block đã chạm dáy return true 
        
        var groundlvl = this.gameBoard.groundlvl;
        var groundtrack = 0;

        for (var i = 0; i < this.block.getPositions().length; i++) {
            if ( this.block.getPositions()[i].y === groundlvl) {
                groundtrack++;
            }
        }

        if (groundtrack > 0) {
            this.collided = true;
            console.log("true");
            return true;
        }
        return false;
    }

    private setLanded(): void { 
        // block chạm đáy lưu vào trong mảng _landed;
        // cập nhật lại gameboard
        
        console.log("set landed");
        
        this.block.uncouple();
        this.block.parentCube.computeWorldMatrix();
        
        for (var c = 0; c < this.block.cubes.length; c++) {
            this.block.cubes[c].computeWorldMatrix();
        }
        this.fixRotationOffset(); 
        this.fixRelPosOffSet();
        // var arr = this.block.cubes;
        if (this.block.type === "cube") {
            this._landed.push(this.block.parentCube);
        }
        else if (this.block.type !== "cube") {
            for (var i = 0; i < this.block.cubes.length; i++) {
                this._landed.push(this.block.cubes[i]);
            }
            this._landed.push(this.block.parentCube);
        }
        
        this.gameBoard.updateSpaces(this.block.getPositions());
        //console.log(this.gameBoard.spaces);

        
    }

    private checkFullLayer(): void { 
        // loop qua từng y(hàng gameboard) kiểm tra hàng nào đầy lưu vào mảng 
        // Thực hiện hạ các hàng xuống 

        console.log("check layer");
        var height = this.gameBoard.height;
        var size = this.gameBoard.size;

        var fullLayer: boolean;
        var layerNums: number[] = new Array();
        var layerheight = null;

        
        for (var y = 0; y < height; y++) { 
            fullLayer = true;
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size; z++) {
                    if (this.gameBoard.spaces[x][y][z] === false) {
                        fullLayer = false
                        
                    }
                    else {
                        layerheight = this.gameBoard.positions[x][y][z].y;
                        
                    }
                }
            }
            if (fullLayer) {
                // console.log("full layer");
                this.clearLayer(y, layerheight, size);
                if (y !== 0) {
                    layerNums.push(y);
                }
                this.scoreCount += size * size; // điểm 1 hàng được cleared 
                fullLayer = false;
                
                // update score gui
                Tools.LoadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf", true).then(
                    (data: ArrayBuffer | string) => 
                    {
                      //Requires data to be ArrayBuffer
                      if (data instanceof ArrayBuffer) 
                      {
                        //native.Canvas.loadTTFAsync("droidsans", data);        
              
                        // GUI
                        this.advancedTexture.dispose();
                        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("Score", true, this.scene);
                        
                        // Manually draw text in the AdvancedDynamicTexture using its context.
                        this.advancedTexture.onEndRenderObservable.add( () => 
                        {
                          var font = "70px droidsans";
                          var context = this.advancedTexture.getContext();
                          //context.clearRect(0, 0, 75, 135);
                          context.font = font;  
                          context.fillText("Score: " + this.scoreCount,75, 135);
                        });
                        //setScoreAdvancedTexture(advancedTexture);  
                      }
                    });
            } 
        }
        
        if (layerNums.length > 0) { //collpase only if full layers exist and were cleared - when layerNums has > 0 elements
            this.collapseLayers(layerNums, size, height);
        }
        
    }

    // clear từng hàng xóa 
    private clearLayer(layer: number, layerheight: number, size: number): void { 
        
        // update lại hàng của gameboard tất cả bằng false
        for (var x = 0; x < size; x++) {
            for (var z = 0; z < size; z++) {
                this.gameBoard.spaces[x][layer][z] = false;
            }
        }

        this.scene.blockfreeActiveMeshesAndRenderingGroups = true; //for optimization
        for (var i = 0; i < this._landed.length; i++) {
            var position = this._landed[i].position;
            if (position.y === layerheight) {
            
                this._landed[i].dispose(); // xóa cube trong khong gian 3d 
                this._landed[i] = null; // lưu lại là null để tí loop xóa ra khỏi mảng
                console.log("cleared block");
            }
        }
        this.scene.blockfreeActiveMeshesAndRenderingGroups = false;
        // console.log(this._landed);

        for (var j = this._landed.length - 1; j >= 0; j--) { 
            if (this._landed[j] === null) {
                this._landed.splice(j, 1);// xóa phần tử ra khỏi mảng
            }
        }
        // console.log(this._landed);
    }

    private collapseLayers(layerNums: number[], size: number, height: number): void { 
        //
        //start 1 from the lowest layer cleared:
        var y = layerNums[layerNums.length - 1] - 1; //ground lvl: y = 11 (height-1); assuming layer isn't y = 0 (top)
        //var layer = y + 1;
        // var y = layerNums[0] - 1; //ground lvl: y = 11 (height-1); assuming layer isn't y = 0 (top)
        // //var layer = y + 1;

        var landedPos = new Array();
        for (var el = 0; el < this._landed.length; el++) {
            landedPos.push(this._landed[el].position);
            console.log("landpos[i]",this._landed[el].position);
            console.log("abs landpos[i]",this._landed[el].getAbsolutePosition());  
        }
        // console.log(landedPos);


        // update space
        // var yUpdate = layerNums[0];
        // for(;yUpdate >= 0 ;yUpdate--){
        // for (var x = 0; x < size; x++) {
        //         for (var z = 0; z < size; z++) {
        //             this.gameBoard.spaces[x][yUpdate][z] = false;
        //         }
        //     }
        // }


        //
        // for (y; y >= 0; y--) {
        //     for (var x = 0; x < size; x++) {
        //         for (var z = 0; z < size; z++) {
                    
        //             for (var i = 0; i < landedPos.length; i++) {
        //                 //see if position in landed same as in position arr in gameboard - should only find 1 match at this xyz
        //                 if (this.gameBoard.compare(landedPos[i], x, y, z) === true) {  //if yes, mesh at that pos to be shifted down
        //                     // console.log(landedPos);
                            
        //                     //each block above layer goes down 1 y until reach lowest y   
        //                     //and shift blocks down if space below = true  
        //                     layer = y + 1;    

        //                     // console.log(this.gameBoard.spaces);
        //                     // console.log(this.gameBoard.spaces[x][layer][z]  === false && layer < height);
        //                     // console.log(x, y, z, i);
        //                     // console.log(x, layer, z);  

        //                     while (layer < height && this.gameBoard.spaces[x][layer][z] === false) {
        //                         console.log("entered");
        //                         //this._landed[i].position.y -= 1; //shift down cube in 3d world
        //                         //console.log(landedPos[i].y);
        //                         landedPos[i].y--;
        //                         this.fixRotationOffset();
        //                         //console.log(landedPos[i].y);
        //                         layer++;
        //                     }

                            
        //                     //this.gameBoard.spaces[x][layer][z] = false;

        //                     // while (layer < height) {
        //                     //     console.log("entered");
        //                     //     //this._landed[i].position.y -= 1; //shift down cube in 3d world
        //                     //     console.log(landedPos[i].y);
        //                     //     landedPos[i].y--;
        //                     //     console.log(landedPos[i].y);
        //                     //     layer++;
        //                     // }
                            
        //                     //this.gameBoard.updateSpaces(landedPos, false, true);
        //                 }
        //             }

        //             //space
        //             this.gameBoard.spaces[x][y][z]
        //         }
        //     }
        //     //this.gameBoard.updateSpaces(landedPos, false, true); //update after entire y plane of cubes shifted down
        // }

        var length = layerNums.length;
        /// test 
        var y = layerNums[0] - 1; //ground lvl: y = 11 (height-1); assuming layer isn't y = 0 (top)
        //var layer = y + 1;
        console.log("yLayer",y);
        console.log("length",length);
        for (y; y >= 0; y--) {
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size; z++) {
                    
                    for (var i = 0; i < landedPos.length; i++) {
                        //see if position in landed same as in position arr in gameboard - should only find 1 match at this xyz
                        if (this.gameBoard.compare(landedPos[i], x, y, z) === true) {  //if yes, mesh at that pos to be shifted down
                         
                            var height = length;
                            while(height > 0 ){
                                landedPos[i].y --;
                                //this.scene.render();
                                //this.fixRotationOffset();
                                height--;
                            }
                            //landedPos[i].y --;
                            console.log("shirt down");
                        }
                    }

                    //space
                    //this.gameBoard.spaces[x][y][z]
                }
            }
            //this.gameBoard.updateSpaces(landedPos, false, true); //update after entire y plane of cubes shifted down
        }

        var yUpdate = layerNums[0] - 1;
        for(;yUpdate >= 0 ;yUpdate--){
        for (var x = 0; x < size; x++) {
                for (var z = 0; z < size; z++) {
                    this.gameBoard.spaces[x][yUpdate][z] = false;
                }
            }
        }

        this.gameBoard.updateSpaces(landedPos);


        //use canMmove method from gameBoard class, pass in one el in landed as one array
        // this.checkFullLayer(); //once collapsed, check for new full layers - runtime error?
        //check layer again once you collapsed - break out of this once checkLayer -> false
        // for(var y = 5; y < this.gameBoard.height; y++){
        //     for(var x = 0; x < this.gameBoard.size; x++){
        //         for(var z = 0; z < this.gameBoard.size; z++){
        //             console.log(this.gameBoard.spaces[x][y][z]);
        //          }
        //      }
        // }
        console.log(this.gameBoard.spaces);
    }

     private canRotate(axis: string): boolean { 

        const _dummy =  this.block;

        if (this.block.type === "big cube" || this.block.type === "cube") {
            return true;
        }
        var occupied: boolean;
        var inBounds: boolean;
        
        switch(axis) {
            case "x":
                _dummy.rotate("x", this._rotation); //rotating dummy doesn't affect parent
                //this.block.position = rotaPos;
                this.scene.render();
                this.fixRotationOffset();
                occupied = this.gameBoard.isOccupiedWhenOutGrid(_dummy.getPositions() /*this.block.getPositions()*/); 
                inBounds = this.gameBoard.inGrid(_dummy.getPositions());
                
                //console.log("positionAfterRo",_dummy.getPositions());
                
                _dummy.rotate("x", -this._rotation); //reset rotation of dummy
                this.scene.render();
                this.fixRotationOffset();
                break;
            case "y":
                _dummy.rotate("y", -this._rotation); //rotating dummy doesn't affect parent
                //this.block.position = rotaPos;
                this.scene.render();
                this.fixRotationOffset();
                occupied = this.gameBoard.isOccupiedWhenOutGrid(_dummy.getPositions() /*this.block.getPositions()*/); 
                inBounds = this.gameBoard.inGrid(_dummy.getPositions());
                
                //console.log("positionAfterRo",_dummy.getPositions());
                
                _dummy.rotate("y", this._rotation); //reset rotation of dummy
                this.scene.render();
                this.fixRotationOffset();
                break;
            case "z":
                _dummy.rotate("z", -this._rotation); //rotating dummy doesn't affect parent
                //this.block.position = rotaPos;
                this.scene.render();
                this.fixRotationOffset();
                occupied = this.gameBoard.isOccupiedWhenOutGrid(_dummy.getPositions() /*this.block.getPositions()*/); 
                inBounds = this.gameBoard.inGrid(_dummy.getPositions());
                
                //console.log("positionAfterRo",_dummy.getPositions());
                
                _dummy.rotate("z", this._rotation); //reset rotation of dummy
                this.scene.render();
                this.fixRotationOffset();
                break;
        } 
        
        if (occupied === false && inBounds === true) { //occupied is false - can rotate
            return true;
        }
        return false;
    }

    //keyboard controls for active, falling block
    public enableControls(button :string) {

            if (this.gameBoard.inGrid(this.block.getPositions()))  {
                this.fixRotationOffset();
                this.checkCollision();
            }
            //keyboard actions
            if (!this.collided && !this.gameOver)  { //when block 1st drawn, outside of grid (!inGrid), can only rotate
                this.fixRotationOffset();
                        switch (button) {
                            //canMove method (gameBoard class) used for collision detection
                            case "forward": //forward
                                if (this.gameBoard.inGrid(this.block.getPositions()) && this.gameBoard.canMove(this.block.getPositions(), "forward")) {
                                    this.block.position.z += 1;
                                    this.scene.render();
                                    this.fixRotationOffset();
                                }
                                break;

                            case "backward": //backward
                                if (this.gameBoard.inGrid(this.block.getPositions()) && this.gameBoard.canMove(this.block.getPositions(), "back")) {
                                    this.block.position.z -= 1;
                                    this.scene.render();
                                    this.fixRotationOffset();
                                }
                                break;

                            case "left": //left
                                if (this.gameBoard.inGrid(this.block.getPositions()) && this.gameBoard.canMove(this.block.getPositions(), "left")) {
                                    this.block.position.x -= 1;
                                    this.scene.render();
                                    this.fixRotationOffset();
                                }
                                break;

                            case "right": //right
                                if (this.gameBoard.inGrid(this.block.getPositions()) && this.gameBoard.canMove(this.block.getPositions(), "right")) {
                                    this.block.position.x += 1;
                                    this.scene.render();
                                    this.fixRotationOffset();
                                }
                                break;

                            case "down": //down
                                //TO FIX: press space bar continuously - canMove not called fast enough, meshes intersect
                                if (this.gameBoard.inGrid(this.block.getPositions()) && this.gameBoard.canMove(this.block.getPositions(), "down")) {
                                    this.block.position.y -= 1;
                                    this.scene.render();
                                    this.fixRotationOffset();
                                }
                                else if (this.gameBoard.inGrid(this.block.getPositions()) && this.gameBoard.canMove(this.block.getPositions(), "down") === false) {
                                    // console.log("2, changed collided");
                                    this.collided = true;
                                } 
                                break;

                            case "rotateX":
                                //if rotated block would be in a position not found in getPositions array - should'nt move (create a canRotate function?)
                                 if (this.canRotate("x")) {
                                   
                                    console.log("Before rotate x",this.block.getPositions()[3]);
                                    this.block.rotate("x", this._rotation); //rotate child 1st to se if it intersects?
                                    this.scene.render();
                                    this.fixRotationOffset();
                                    //console.log("this.gameBoard.positions[0][1][4.5]",this.gameBoard.positions[0][-6][0]);
                                    console.log("After rotate x",this.block.getPositions()[3]);
                                    }
                                break;

                            case "rotateY":
                                // if (this.canRotate("y")) {
                                    console.log("rotate y");
                                    this.block.rotate("y", this._rotation);
                                    this.scene.render();
                                    this.fixRotationOffset();
                                // }
                                break;

                            case "rotateZ":
                                // if (this.canRotate("z")) {
                                    console.log("rotate z");
                                    this.block.rotate("z", this._rotation);
                                    this.scene.render(); 
                                    this.fixRotationOffset();
                                // }
                                break;
                        }

                        this.fixRotationOffset();
                }     
        ;
    }

    public isGameOver(): boolean { 
        // kiểm tra postiontion của block

        var size = this.gameBoard.size;
        var height = this.gameBoard.height;
        var top = (height / 2) - 0.5;

        var spawnPos: Vector3[] = this.block.getPositions();
        var clonedPos: Vector3[] = JSON.parse(JSON.stringify(spawnPos)); 

        var posBelow: Vector3[] = new Array();

        for (var i = 0; i < clonedPos.length; i++) {
            if (clonedPos[i].y === top) { //top + 1
                var vector = new Vector3(clonedPos[i].x, clonedPos[i].y - 1, clonedPos[i].z);
                posBelow.push(vector);
            }   
        }


        var tracker = 0;

        for (var x = 0; x < size; x++) {
            for (var y = 0; y < height; y++) {
                for (var z = 0; z < size; z++) {
                    
                    for (var i = 0; i < posBelow.length; i++) {
                        if (this.gameBoard.compare(posBelow[i], x, y, z)) {
                            if (this.gameBoard.spaces[x][y][z] === true) {
                                tracker++;
                            }
                        }
                    }
                }
            }
        }

        if (tracker > 0) {
            this.gameOver = true;
            return true;
        }
         
        return false;
    }
    
    private drawGameOver() {
    Tools.LoadFileAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/droidsans.ttf", true).then(
                    (data: ArrayBuffer | string) => 
                    {
                      //Requires data to be ArrayBuffer
                      if (data instanceof ArrayBuffer) 
                      {
                        //native.Canvas.loadTTFAsync("droidsans", data);        
              
                        // GUI
                        this.gameOverAdvancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
                        
                        // Manually draw text in the AdvancedDynamicTexture using its context.
                        this.gameOverAdvancedTexture.onEndRenderObservable.add( () => 
                        {
                          var font = "110px droidsans";
                          var context = this.gameOverAdvancedTexture.getContext();
                          context.font = font;  
                          context.fillText("Game Over",this.gameOverAdvancedTexture.getSize().width / 3, this.gameOverAdvancedTexture.getSize().height / 2);
                        });
                        
                      }
                    });
    }

    //  
    public completeLines():number{
        var result = 0;
        var height = this.gameBoard.height;
        var size = this.gameBoard.size;
        var fullLayer: boolean;
        for (var y = 0; y < height; y++) { //for each layer of y height...
            fullLayer = true;
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size; z++) {
                    if (this.cloneSpaces[x][y][z] === false) { //if element in layer in false
                        fullLayer = false
                        //fullLayer stays true if element in layer never = false
                    }
                }
            }
            if(fullLayer){
                result++;
            }
        }
        return result*6;
    }

    // 
    public aggregateHeight():number{
        var size = this.gameBoard.size;
        var result = 0;
        for(var x = 0; x < size; x++){
            for(var z = 0; z < size; z++){
                result += this.columnHeight(x,z);
            }
        }
        return result;
    }

    // 
    public holes():number{
        var result = 0;
        var size = this.gameBoard.size;
        var height = this.gameBoard.height;

        for (var x = 0; x < size; x++) { //for each layer of y height...
            for (var z = 0; z < size; z++) {
                var check = false;
                for (var y = 0; y < height; y++) {
                    if (this.cloneSpaces[x][y][z] === true) { //if element in layer in false
                        check = true;
                    } else if (this.cloneSpaces[x][y][z] === false && check){
                        result++;
                    }
                }
            }
        }
        return result;
    }

    // 
    public Bumpiness():number{
        //var height = this.gameBoard.height;
        var size = this.gameBoard.size;
        var result = 0;

        for(var x = 0; x < size; x++){
            // if(x == size - 1){
            //     for (var z = 0; z < size - 1; z++) {
            //         result += Math.abs(this.columnHeight(x,z) - this.columnHeight(x,z+1));
            //     }
            // }
            for (var z = 0; z < size - 1; z++) {
                result += Math.abs(this.columnHeight(x,z) - this.columnHeight(x,z+1));
            }
        }

        for(var z = 0; z < size; z++){
            // if(x == size - 1){
            //     for (var z = 0; z < size - 1; z++) {
            //         result += Math.abs(this.columnHeight(x,z) - this.columnHeight(x,z+1));
            //     }
            // }
            for (var x = 0; x < size - 1; x++) {
                result += Math.abs(this.columnHeight(x,z) - this.columnHeight(x+1,z));
            }
        }
        return result;
    }

    // 
    private columnHeight(x: number,z: number):number{
        //var size = this.gameBoard.size;
        var height = this.gameBoard.height;
        // for (; y < height && !check; y++) {
        //     for (var z = 0; z < this.gameBoard.spaces[x][y].length && !check; z++) {
        //         if (this.gameBoard.spaces[x][y][z] === false){
        //             check = true;
        //         }  
        //     }
        // }

             var y = 0;
             //var check = false;
                     for (; y < height; y++) {
                         if (this.cloneSpaces[x][y][z] === true){
                            break;
                       }
                     }
                     return height - y;
             
        // for (var x = 0; x < _size; x++) {
        //     for (var z = 0; z < _size ; z++) {
        //      var y = 0;
        //      var check = false;
        //              for (; y < _height && !check; y++) {
        //                  if (spaces[x][y][z] === false){
        //                     check = true;
        //                }
        //              }
        //              console.log(_height - y);  
        //        }
        //      }
    }
   
    private bestMove():void{
        this.findBestMove = false;
        console.log("in best move");
        this.cloneSpaces = this.cloningSpace();
        this.cloneBlock = this.cloningBlock();
        this.dummy =  this.cloningBlock(); 
        this.dummy.position.y = this.block.position.y;
        this.scene.render();
        this.fixRotationOffsetDummy();
        this.cloneBlock.uncouple();
        this.cloneBlock.setRelPos(this.dummy.getPositions());
        
        this.cloneBlock.setVisible(false);
        var bestScore = -Infinity;
        var bestPositon:Vector3 = this.cloningPosition(this.cloneBlock.position);
        var rotate = "x";
        var bestStep = 0;
        var bestYStep = 0;

        var size = this.gameBoard.size;
        
        for (var x = 0; x < size; x++) {
            for (var z = 0; z < size ; z++) {

                        // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.cloneBlock.position.y = this.block.position.y;
                        
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();

                        // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
                        //     continue;
                        // }

                        // while(true){
                        //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
                        //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
                        //         break;
                        //     }
                        //     this.cloneBlock.position.y-=1;
                        //     this.scene.render();
                        //     this.fixRotationOffsetCloneBlock();
                        // }

                        // this.cloneBlock.position.y+=1;
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();
                        //this.cloneBlock.setRelPos(this.block.getPositions());
                        // this.dummy.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.dummy.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.scene.render();
                        // console.log("dummy pos", this.dummy.getPositions());
                        //this.dummy
                        //console.log("dummy pos", this.dummy.getPositions());

                        //console.log("x",x + "z",z);
                        this.setPostionCloneBlock(x,z);
                        //console.log("clone block relPos",this.cloneBlock.getRelPos());
                        
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                        
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                            //console.log("Clone block move down",this.cloneBlock.getRelPos());
                        }
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    
                        //console.log("Clone block move up",this.cloneBlock.getRelPos());

                        this.updateCloneSpaces(this.cloneBlock.getRelPos());
                        var score = this.computeScore();
                        console.log("firt score",score);
                        this.resetCloneSpaces(this.cloneBlock.getRelPos());



                if(score > bestScore){
                    bestScore = score;
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    

                    // console.log("xBest: ",x);
                    // console.log("yBest: ",y);
                    // console.log("zBest: ",z);
                    //best = this.cloningBlock(this.cloneBlock);
                    //best.setVisible(false);
                    //console.log("bestScore",bestScore);
                }
                
                //bestPositon = this.cloningPosition(this.cloneBlock.position);
                //best = this.cloneBlock;
            }
        }
        //return;
        // rotate 0y
          for(var ystep = 1; ystep < 4; ystep++){
                    //console.log("dummy pos",this.dummy.getPositions());
                    this.dummy.rotate("y",this._rotation);
                    this.scene.render();
                    this.fixRotationOffsetDummy();
                    //this.cloneBlock.uncouple();
                    this.cloneBlock.setRelPos(this.dummy.getPositions());

                    //console.log("block", this.block.getPositions());
                    console.log("dummy rotate y", this.dummy.getPositions());
                    console.log("cloneblock rotate y", this.cloneBlock.getRelPos());
                    
                    for (var x = 0; x < size; x++) {
                        for (var z = 0; z < size ; z++) {

                            // this.dummy.position.x = this.gameBoard.positions[x][0][z].x;
                            // this.dummy.position.z = this.gameBoard.positions[x][0][z].z;
                            // this.scene.render();
                            // console.log("dummy pos", this.dummy.getPositions());
                            //this.dummy
                            //console.log("dummy pos", this.dummy.getPositions());
    
                            //console.log("x",x + "z",z);
                            
                            this.setPostionCloneBlock(x,z);
                            console.log("clone block relPos after set",this.cloneBlock.getRelPos());

                            if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                                console.log("out grid");
                                continue;
                            }
    
                            while(true){
                                if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                                || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                    break;
                                }
                                this.cloneBlock.moveRelPosDown();
                                this.fixOffSetCloneBlock();
                            }
    
                            this.cloneBlock.moveRelPosUp();
                            this.fixOffSetCloneBlock();
        
                        this.updateCloneSpaces(this.cloneBlock.getRelPos());
                        var score = this.computeScore();
                        this.resetCloneSpaces(this.cloneBlock.getRelPos());
                        //this.cloneSpaces = this.cloningSpace();
                        console.log("score:",score);
                        if(score > bestScore){
                            
                            bestScore = score;
                            bestPositon = this.cloningPosition(this.cloneBlock.position);
                            //rotate = "x";
                            //bestStep = 0;
                            bestYStep = ystep;
                            
                            }
                        }
                    }
            }

            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            console.log("rotate x");
        //return;
        if(this.cloneBlock.type === "t block"){

            //step 1
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());
            
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                    
                        // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.cloneBlock.position.y = this.block.position.y;
                        
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();
                        // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
                        //     continue;
                        // }

                        // while(true){
                        //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
                        //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
                        //         break;
                        //     }
                        //     this.cloneBlock.position.y-=1;
                        //     this.scene.render();
                        //     this.fixRotationOffsetCloneBlock();
                        // }

                        // this.cloneBlock.position.y+=1;
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();

                        // this.dummy.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.dummy.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.scene.render();
                        // console.log("dummy pos", this.dummy.getPositions());
                        // //this.dummy
                        // console.log("dummy pos", this.dummy.getPositions());

                        this.setPostionCloneBlock(x,z);
                        
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }

                        
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    

                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());
    
                    if(score > bestScore){
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "x";
                        bestStep = 1;
                        bestYStep = 0;
                        // console.log("xBest: ",x);
                        // console.log("yBest: ",y);
                        // console.log("zBest: ",z);
                        //best = this.cloningBlock(this.cloneBlock);
                        //best.setVisible(false);
                        //console.log("bestScore",bestScore);
                    }
                    
    
                    //bestPositon = this.cloningPosition(this.cloneBlock.position);
                    //best = this.cloneBlock;
                }
            }
            for(var ystep = 1; ystep < 4; ystep++){
                //console.log("dummy pos",this.dummy.getPositions());
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                //this.cloneBlock.uncouple();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
                
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {

                        // this.dummy.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.dummy.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.scene.render();
                        // console.log("dummy pos", this.dummy.getPositions());
                        //this.dummy
                        //console.log("dummy pos", this.dummy.getPositions());

                        //console.log("x",x + "z",z);
                        
                        this.setPostionCloneBlock(x,z);

                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }

                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }

                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();
    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());
                    //this.cloneSpaces = this.cloningSpace();
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "x";
                        bestStep = 1;
                        bestStep = ystep;
                    }
                    }
                }
            }
            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());

            //return;   
            //step 2
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                    
                        // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.cloneBlock.position.y = this.block.position.y;
                        
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();
                        // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
                        //     continue;
                        // }

                        // while(true){
                        //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
                        //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
                        //         break;
                        //     }
                        //     this.cloneBlock.position.y-=1;
                        //     this.scene.render();
                        //     this.fixRotationOffsetCloneBlock();
                        // }

                        // this.cloneBlock.position.y+=1;
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();

                        // this.dummy.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.dummy.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.scene.render();
                        // console.log("dummy pos", this.dummy.getPositions());
                        // //this.dummy
                        // console.log("dummy pos", this.dummy.getPositions());

                        this.setPostionCloneBlock(x,z);
                        
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }

                        
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    

                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());
    
                    if(score > bestScore){
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "x";
                        bestStep = 2;
                        bestYStep = 0;
                        // console.log("xBest: ",x);
                        // console.log("yBest: ",y);
                        // console.log("zBest: ",z);
                        //best = this.cloningBlock(this.cloneBlock);
                        //best.setVisible(false);
                        //console.log("bestScore",bestScore);
                    }
                    
    
                    //bestPositon = this.cloningPosition(this.cloneBlock.position);
                    //best = this.cloneBlock;
                }
            }
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                //this.cloneBlock.uncouple();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                        
                            // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
                            // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
                            // this.cloneBlock.position.y = this.block.position.y;
                            
                            // this.scene.render();
                            // this.fixRotationOffsetCloneBlock();
                            // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
                            //     continue;
                            // }
    
                            // while(true){
                            //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
                            //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
                            //         break;
                            //     }
                            //     this.cloneBlock.position.y-=1;
                            //     this.scene.render();
                            //     this.fixRotationOffsetCloneBlock();
                            // }
    
                            // this.cloneBlock.position.y+=1;
                            // this.scene.render();
                            // this.fixRotationOffsetCloneBlock();
    
                            // this.dummy.position.x = this.gameBoard.positions[x][0][z].x;
                            // this.dummy.position.z = this.gameBoard.positions[x][0][z].z;
                            // this.scene.render();
                            // console.log("dummy pos", this.dummy.getPositions());
                            // //this.dummy
                            // console.log("dummy pos", this.dummy.getPositions());
    
                            this.setPostionCloneBlock(x,z);
                            
                            if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                                continue;
                            }
    
                            while(true){
                                if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                                || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                    break;
                                }
                                this.cloneBlock.moveRelPosDown();
                                this.fixOffSetCloneBlock();
                            }
                             
                            this.cloneBlock.moveRelPosUp();
                            this.fixOffSetCloneBlock();    
    
                        
                        this.updateCloneSpaces(this.cloneBlock.getRelPos());
                        var score = this.computeScore();
                        this.resetCloneSpaces(this.cloneBlock.getRelPos());
        
                        if(score > bestScore){
                            bestScore = score;
                            bestPositon = this.cloningPosition(this.cloneBlock.position);
                            rotate = "x";
                            bestStep = 2;
                            bestYStep = 1;
                            // console.log("xBest: ",x);
                            // console.log("yBest: ",y);
                            // console.log("zBest: ",z);
                            //best = this.cloningBlock(this.cloneBlock);
                            //best.setVisible(false);
                            //console.log("bestScore",bestScore);
                        }
                        
        
                        //bestPositon = this.cloningPosition(this.cloneBlock.position);
                        //best = this.cloneBlock;
                    
                    }
                }
                this.dummy.rotate("y",-this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());

            
            //step 3
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());   

            
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());
            
             // rorate z
             // step 1
            //  this.cloneBlock.rotate("z",this._rotation);
            //  this.scene.render();
            //  this.fixRotationOffsetCloneBlock();
            //  this.cloneBlock.setRelPos(this.cloneBlock.getPositions()); 

            this.dummy.rotate("z",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());

               for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {

                        // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.cloneBlock.position.y = this.block.position.y;
                        
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();
                        // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
                        //     continue;
                        // }

                        // while(true){
                        //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
                        //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
                        //         break;
                        //     }
                        //     this.cloneBlock.position.y-=1;
                        //     this.scene.render();
                        //     this.fixRotationOffsetCloneBlock();
                        // }

                        // this.cloneBlock.position.y+=1;
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();
                        
                            //this.cloneBlock.setRelPos(this.block.getPositions());
                        
                        this.setPostionCloneBlock(x,z);
                        
                        //this.scene.render();
                        //this.fixOffSetCloneBlock();
                    
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }

                    
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();
                    
    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());
                    //this.cloneSpaces = this.cloningSpace();
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "z";
                        bestStep = 1;
                        bestYStep = 0;
                     }
                    }
                }

                for(var ystep = 1; ystep < 4; ystep++){
                    // this.cloneBlock.rotate("y",this._rotation);
                    // this.scene.render();
                    // this.fixRotationOffsetCloneBlock();
                    // this.cloneBlock.setRelPos(this.cloneBlock.getPositions());
                    this.dummy.rotate("Y",this._rotation);
                    this.scene.render();
                    this.fixRotationOffsetDummy();
                    this.cloneBlock.setRelPos(this.dummy.getPositions()); 
        
                    for (var x = 0; x < size; x++) {
                        for (var z = 0; z < size ; z++) {
                        

                        // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
                        // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
                        // this.cloneBlock.position.y = this.block.position.y;
                        
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock();
                        // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
                        //     continue;
                        // }

                        // while(true){
                        //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
                        //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
                        //         break;
                        //     }
                        //     this.cloneBlock.position.y-=1;
                        //     this.scene.render();
                        //     this.fixRotationOffsetCloneBlock();
                        // }

                        // this.cloneBlock.position.y+=1;
                        // this.scene.render();
                        // this.fixRotationOffsetCloneBlock(); 

                        this.setPostionCloneBlock(x,z);
                    
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }

                    
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();

        
                        this.updateCloneSpaces(this.cloneBlock.getRelPos());
                        var score = this.computeScore();
                        this.resetCloneSpaces(this.cloneBlock.getRelPos());
                        //this.cloneSpaces = this.cloningSpace();
                        console.log("score:",score);
                        if(score > bestScore){
                            
                            bestScore = score;
                            bestPositon = this.cloningPosition(this.cloneBlock.position);
                            rotate = "z";
                            bestStep = 1;
                            bestYStep = ystep;
    
                         }
                        }
                    }
                }
                this.dummy.rotate("y",this._rotation);      
                this.scene.render();
                this.fixRotationOffsetCloneBlock();
                this.cloneBlock.setRelPos(this.dummy.getPositions());     
                
            // step 2
            // this.cloneBlock.rotate("z",this._rotation);
            // this.scene.render();
            // this.fixRotationOffsetCloneBlock();
            // this.cloneBlock.setRelPos(this.cloneBlock.getPositions());

            // this.dummy.rotate("z",this._rotation);
            // this.scene.render();
            // this.fixRotationOffsetDummy();
            // this.cloneBlock.setRelPos(this.dummy.getPositions()); 

            //   for (var x = 0; x < size; x++) {
            //        for (var z = 0; z < size ; z++) {

            //         // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
            //         // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
            //         // this.cloneBlock.position.y = this.block.position.y;
                    
            //         // this.scene.render();
            //         // this.fixRotationOffsetCloneBlock();
            //         // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
            //         //     continue;
            //         // }

            //         // while(true){
            //         //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
            //         //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
            //         //         break;
            //         //     }
            //         //     this.cloneBlock.position.y-=1;
            //         //     this.scene.render();
            //         //     this.fixRotationOffsetCloneBlock();
            //         // }

            //         // this.cloneBlock.position.y+=1;
            //         // this.scene.render();
            //         // this.fixRotationOffsetCloneBlock();
                    
            //         //this.cloneBlock.setRelPos(this.block.getPositions());

            //         this.setPostionCloneBlock(x,z);
                    
            //         if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
            //             continue;
            //         }

            //         while(true){
            //             if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
            //             || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
            //                 break;
            //             }
            //             this.cloneBlock.moveRelPosDown();
            //             this.fixOffSetCloneBlock();
            //         }
                    
                    
            //         this.cloneBlock.moveRelPosUp();
            //          this.fixOffSetCloneBlock();
   
            //        this.updateCloneSpaces(this.cloneBlock.getRelPos());
            //        var score = this.computeScore();
            //        this.resetCloneSpaces(this.cloneBlock.getRelPos());
            //        //this.cloneSpaces = this.cloningSpace();
            //        console.log("score:",score);
            //        if(score > bestScore){
                       
            //            bestScore = score;
            //            bestPositon = this.cloningPosition(this.cloneBlock.position);
            //            rotate = "z";
            //            bestStep = 2;
            //            bestYStep = 0;
            //         }
            //        }
            //    }
            
            //    this.cloneBlock.rotate("y",this._rotation);      
            //    this.scene.render();
            //    this.fixRotationOffsetCloneBlock();
            //    this.cloneBlock.setRelPos(this.cloneBlock.getPositions());

            // this.dummy.rotate("y",this._rotation);
            // this.scene.render();
            // this.fixRotationOffsetDummy();
            // this.cloneBlock.setRelPos(this.dummy.getPositions()); 


            //    for (var x = 0; x < size; x++) {
            //     for (var z = 0; z < size ; z++) {
                            
            //             // this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
            //             // this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
            //             // this.cloneBlock.position.y = this.block.position.y;
                        
            //             // this.scene.render();
            //             // this.fixRotationOffsetCloneBlock();
            //             // if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
            //             //     continue;
            //             // }

            //             // while(true){
            //             //     if(!this.gameBoard.inGrid2(this.cloneBlock.getPositions()) 
            //             //     || this.gameBoard.isOccupied3(this.cloneBlock.getPositions())){
            //             //         break;
            //             //     }
            //             //     this.cloneBlock.position.y-=1;
            //             //     this.scene.render();
            //             //     this.fixRotationOffsetCloneBlock();
            //             // }

            //             // this.cloneBlock.position.y+=1;
            //             // this.scene.render();
            //             // this.fixRotationOffsetCloneBlock();
                        
            //             //this.cloneBlock.setRelPos(this.block.getPositions());

            //             this.setPostionCloneBlock(x,z);
                    
            //         if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
            //             continue;
            //         }

            //         //this.cloneBlock.uncouple();
            //         while(true){
            //             if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
            //             || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
            //                 break;
            //             }
            //             this.cloneBlock.moveRelPosDown();
            //             this.fixOffSetCloneBlock();
            //         }
                    
                    
            //         this.cloneBlock.moveRelPosUp();
            //             this.fixOffSetCloneBlock();

            //     this.updateCloneSpaces(this.cloneBlock.getRelPos());
            //     var score = this.computeScore();
            //     this.resetCloneSpaces(this.cloneBlock.getRelPos());
            //     //this.cloneSpaces = this.cloningSpace();
            //     console.log("score:",score);
            //     if(score > bestScore){
                    
            //         bestScore = score;
            //         bestPositon = this.cloningPosition(this.cloneBlock.position);
            //         rotate = "z";
            //         bestStep = 2;
            //         bestYStep = 1;
            //         }
            //       }
            //     }
                
                // this.cloneBlock.rotate("y",-this._rotation);      
                // this.scene.render();
                // this.fixRotationOffsetCloneBlock();
                // //this.cloneBlock.setRelPos(this.cloneBlock.getPositions()); 

                // //step3 rotate z
                // this.cloneBlock.rotate("z",this._rotation);
                // this.scene.render();
                // this.fixRotationOffsetCloneBlock();
                
                // this.cloneBlock.rotate("z",this._rotation);
                // this.scene.render();
                // this.fixRotationOffsetCloneBlock();

        } else if(this.cloneBlock.type == "z block"){
            console.log("z block");
            //rotate x
            // step 1
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());

            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                
                    this.setPostionCloneBlock(x,z);            
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }
              
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();

                this.updateCloneSpaces(this.cloneBlock.getRelPos());
                var score = this.computeScore();
                this.resetCloneSpaces(this.cloneBlock.getRelPos());

                if(score > bestScore){
                    
                    bestScore = score;
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    rotate = "x";
                    bestStep = 1;
                    bestYStep = 0;
                 }
                }
            }

            for(var ystep = 1; ystep < 4; ystep++){
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
                
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                           
                        this.setPostionCloneBlock(x,z);
                        console.log("z block step1 rorate y",this.cloneBlock.getRelPos());
                        
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                        
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    

                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());

                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        console.log("best pos of clone block",this.cloneBlock.getRelPos())
                        rotate = "x";
                        bestStep = 1;
                        bestYStep = ystep;
                     }
                    }
                }
            }
            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            //this.cloneBlock.setRelPos(this.dummy.getPositions());
            
            //step 2
            this.dummy.rotate("x",-this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            //this.cloneBlock.setRelPos(this.dummy.getPositions());

            // step 3
            // this.dummy.rotate("x",this._rotation);
            // this.scene.render();
            // this.fixRotationOffsetDummy();

            // step 4
            // this.dummy.rotate("x",this._rotation);
            // this.scene.render();
            // this.fixRotationOffsetDummy();

            // rorate z
            //step 1
            this.dummy.rotate("z",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());

            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                   
                    this.setPostionCloneBlock(x,z);
                        
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }
              
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();    

                
                this.updateCloneSpaces(this.cloneBlock.getRelPos());
                var score = this.computeScore();
                this.resetCloneSpaces(this.cloneBlock.getRelPos());
                console.log("score:",score);
                if(score > bestScore){
                    
                    bestScore = score;
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    rotate = "z";
                    bestStep = 1;
                    bestYStep = 0;
                 }
                }
            }

            for(var ystep = 1; ystep < 4; ystep++){
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
    
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                    
                        this.setPostionCloneBlock(x,z);
                        
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                  
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();    
    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                    //this.cloneSpaces = this.cloningSpace();
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "z";
                        bestStep = 1;
                        bestYStep = ystep;
                     }
                    }
                }
            }
            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            
           
            // step 2
            // for(var step = 2; step < 3; step++){
            //     this.cloneBlock.rotate("z",this._rotation);
            //     this.scene.render();
            //     this.fixRotationOffsetCloneBlock();
    
            //     for (var x = 0; x < size; x++) {
            //         for (var z = 0; z < size ; z++) {
                        
            //             this.cloneBlock.position.x = this.gameBoard.positions[x][0][z].x;
            //             this.cloneBlock.position.z = this.gameBoard.positions[x][0][z].z;
                        
                    
            //         if(this.gameBoard.inGrid2(this.cloneBlock.getPositions()) === false){
            //             continue;
            //         }
                    
            //         while(this.gameBoard.isOccupied2(this.cloneBlock.getPositions()) === false){
            //             this.cloneBlock.position.y -= 1;
            //         }
                    
            //         this.scene.render();
            //         this.fixRotationOffsetCloneBlock();

            //         this.updateCloneSpaces(this.cloneBlock.getPositions());
            //         var score = this.computeScore();
            //         this.resetCloneSpaces(this.cloneBlock.getPositions());
            //         //this.cloneSpaces = this.cloningSpace();
            //         console.log("score:",score);
            //         if(score > bestScore){
                        
            //             bestScore = score;
            //             bestPositon = this.cloningPosition(this.cloneBlock.position);
            //             rotate = "z";
            //             bestStep = step;
            //             bestYStep = 0;
            //          }
            //         }
            //     }
            // }

            //step 3
            // this.cloneBlock.rotate("z",this._rotation);
            // this.scene.render();
            // this.fixRotationOffsetCloneBlock(); 
            
            //step 4
            // this.cloneBlock.rotate("z",this._rotation);
            // this.scene.render();
            // this.fixRotationOffsetCloneBlock();            
            
        } else if(this.cloneBlock.type == "L block"){   
            
            // rorate x
            //step1
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                
                    this.setPostionCloneBlock(x,z);
                    
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }
              
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();    

                
                this.updateCloneSpaces(this.cloneBlock.getRelPos());
                var score = this.computeScore();
                this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                console.log("score:",score);
                if(score > bestScore){
                    
                    bestScore = score;
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    rotate = "x";
                    bestStep = 1;
                    bestYStep = 0;
                 }
                }
            }

            for(var ystep = 1; ystep < 4; ystep++){
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
    
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                    
                        this.setPostionCloneBlock(x,z);
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                  
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    
    
                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "x";
                        bestStep = 1;
                        bestYStep = ystep;
                     }
                    }
                }
            }
            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            //this.cloneBlock.setRelPos(this.dummy.getPositions());

            // step2
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
            
                    this.setPostionCloneBlock(x,z);
                    
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }
                    console.log("cloneBlock RelPos",this.cloneBlock.getRelPos());
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();    

                
                this.updateCloneSpaces(this.cloneBlock.getRelPos());
                var score = this.computeScore();
                this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                console.log("score:",score);
                if(score > bestScore){
                    
                    bestScore = score;
                    console.log("bestClone pos",this.cloneBlock.getRelPos());
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    rotate = "x";
                    bestStep = 2;
                    bestYStep = 0;
                 }
                }
            }

            for(var ystep = 1; ystep < 4; ystep++){
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
    
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                    
                        this.setPostionCloneBlock(x,z);
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                        
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    
    
                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "x";
                        bestStep = 2;
                        bestYStep = ystep;
                     }
                    }
                }
            }
            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();

            // step3
            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());
            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                

                    this.setPostionCloneBlock(x,z);
                    
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }
              
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();    

                
                this.updateCloneSpaces(this.cloneBlock.getRelPos());
                var score = this.computeScore();
                this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                console.log("score:",score);
                if(score > bestScore){
                    
                    bestScore = score;
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    rotate = "x";
                    bestStep = 3;
                    bestYStep = 0;
                 }
                }
            }

            for(var ystep = 1; ystep < 4; ystep++){
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
    
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                    
                        this.setPostionCloneBlock(x,z);
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                  
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    
    
                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "x";
                        bestStep = 3;
                        bestYStep = ystep;
                     }
                    }
                }
            }
            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();

            this.dummy.rotate("x",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();

            // rorate z
            // step1
            this.dummy.rotate("z",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());     

            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                

                    this.setPostionCloneBlock(x,z);
                    
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }
              
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();    

                
                this.updateCloneSpaces(this.cloneBlock.getRelPos());
                var score = this.computeScore();
                this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                console.log("score:",score);
                if(score > bestScore){
                    
                    bestScore = score;
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    rotate = "z";
                    bestStep = 1;
                    bestYStep = 0;
                 }
                }
            }

            for(var ystep = 1; ystep < 4; ystep++){
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
    
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                    
                        this.setPostionCloneBlock(x,z);
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                  
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    
    
                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "z";
                        bestStep = 1;
                        bestYStep = ystep;
                     }
                    }
                }
            }
            this.dummy.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();

            // step2
            this.dummy.rotate("z",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            //this.cloneBlock.setRelPos(this.dummy.getPositions());

            //step 3
            this.dummy.rotate("z",this._rotation);
            this.scene.render();
            this.fixRotationOffsetDummy();
            this.cloneBlock.setRelPos(this.dummy.getPositions());

            for (var x = 0; x < size; x++) {
                for (var z = 0; z < size ; z++) {
                
                    this.setPostionCloneBlock(x,z);
                    
                    if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                        continue;
                    }
              
                    while(true){
                        if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                        || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                            break;
                        }
                        this.cloneBlock.moveRelPosDown();
                        this.fixOffSetCloneBlock();
                    }
                    
                    this.cloneBlock.moveRelPosUp();
                    this.fixOffSetCloneBlock();    

                
                this.updateCloneSpaces(this.cloneBlock.getRelPos());
                var score = this.computeScore();
                this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                console.log("score:",score);
                if(score > bestScore){
                    
                    bestScore = score;
                    bestPositon = this.cloningPosition(this.cloneBlock.position);
                    rotate = "z";
                    bestStep = 3;
                    bestYStep = 0;
                 }
                }
            }

            for(var ystep = 1; ystep < 4; ystep++){
                this.dummy.rotate("y",this._rotation);
                this.scene.render();
                this.fixRotationOffsetDummy();
                this.cloneBlock.setRelPos(this.dummy.getPositions());
    
                for (var x = 0; x < size; x++) {
                    for (var z = 0; z < size ; z++) {
                    
                        this.setPostionCloneBlock(x,z);
                        if(this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) === false){
                            continue;
                        }
                  
                        while(true){
                            if(!this.gameBoard.inGrid2(this.cloneBlock.getRelPos()) 
                            || this.gameBoard.isOccupied3(this.cloneBlock.getRelPos())){
                                break;
                            }
                            this.cloneBlock.moveRelPosDown();
                            this.fixOffSetCloneBlock();
                        }
                        
                        this.cloneBlock.moveRelPosUp();
                        this.fixOffSetCloneBlock();    
    
                    
                    this.updateCloneSpaces(this.cloneBlock.getRelPos());
                    var score = this.computeScore();
                    this.resetCloneSpaces(this.cloneBlock.getRelPos());  
                    console.log("score:",score);
                    if(score > bestScore){
                        
                        bestScore = score;
                        bestPositon = this.cloningPosition(this.cloneBlock.position);
                        rotate = "z";
                        bestStep = 3;
                        bestYStep = ystep;
                     }
                    }
                }
            }

        } else {
            

            
        
        }

        this.block.position.x = bestPositon.x;
        this.block.position.z = bestPositon.z;

        this.scene.render();
        this.fixRotationOffset();

        console.log("best positions",this.block.getPositions());
        console.log("best ystep",bestYStep);

        for(var i = 1; i <= bestStep;i++){
            this.block.rotate(rotate,this._rotation);
            this.scene.render();
            this.fixRotationOffset();
        }

        for(var j  = 1; j <= bestYStep;j++){
            this.block.rotate("y",this._rotation);
            this.scene.render();
            this.fixRotationOffset();
        }

        console.log("Beststep:" ,bestStep);
        console.log("rotate:" ,rotate);
        console.log("BestScore:" ,bestScore);
        console.log("block:" ,this.cloneBlock.type);
    }

    private setPostionCloneBlock(x:number,z:number):void{
                        
        var xPos = this.gameBoard.positions[x][0][z].x - this.cloneBlock.position.x;
        var yPos =  this.block.position.y - this.cloneBlock.position.y;
        var zPos =  this.gameBoard.positions[x][0][z].z - this.cloneBlock.position.z;

        this.cloneBlock.setRelPosXYZ(xPos,yPos,zPos);
        this.fixOffSetCloneBlock();
    }

    private cloningBlock():Block{
        if(this.block.type === "t block"){
            return new TBlock(this.scene);  
        } else if(this.block.type === "big cube"){
            return new Cube(this.scene); 
        } else if(this.block.type === "L block"){
            return new LBlock(this.scene); 
        } 
        return new ZBlock(this.scene); 
    }

    private cloningPosition(postion:Vector3):Vector3{
        return new Vector3(postion.x,postion.y,postion.z);
    }

    private cloningSpace():any[]{
        var size = this.gameBoard.size;
        var height = this.gameBoard.height;
        var spaces = new Array(size); 
        for (var x = 0; x < size; x++) { 
            spaces[x] = new Array(height);

            for (var y = 0; y < height; y++) { 
                spaces[x][y] = new Array(size);

                for (var z = 0; z < size; z++) { 
                    spaces[x][y][z] = this.gameBoard.spaces[x][y][z];
                }
            }
        }
        return spaces;
    }

    private computeScore():number{
        var completeLines = this.completeLines();
        var bumpiness = this.Bumpiness();
        var aggregateHeight = this.aggregateHeight();
        var holes = this.holes();

        console.log("completeLine: ",completeLines);
        console.log("bumpiness: ",bumpiness);
        console.log("aggregateHeight: ",aggregateHeight);
        console.log("holes: ",holes);

        return completeLines - bumpiness - aggregateHeight - holes;
    }

    private updateCloneSpaces(position: Vector3[]){
        var size = this.gameBoard.size;
        var height = this.gameBoard.height;

        for (var x = 0; x < size; x++) {
            for (var y = 0; y < height; y++) {
                for (var z = 0; z < size; z++) {
                    for (var i = 0; i < position.length; i++) {
                       
                        if (this.compareCloneSpace(position[i], x, y, z) === true) {
                            this.cloneSpaces[x][y][z] = true;
                           
                        }
                        
                    }   
                }
            }
        }
    }

    private resetCloneSpaces(position: Vector3[]){
        var size = this.gameBoard.size;
        var height = this.gameBoard.height;

        for (var x = 0; x < size; x++) {
            for (var y = 0; y < height; y++) {
                for (var z = 0; z < size; z++) {

                    for (var i = 0; i < position.length; i++) {
                        if (this.compareCloneSpace(position[i], x, y, z) === true) {
                            this.cloneSpaces[x][y][z] = false; 
                        }          
                    }

                }
            }
        }
    }

    private compareCloneSpace(position: Vector3, x: number, y: number, z: number): boolean {
        var match = this.gameBoard.positions[x][y][z].x === position.x && this.gameBoard.positions[x][y][z].y === position.y 
                    && this.gameBoard.positions[x][y][z].z === position.z;
        return match;
    }

    private fixRotationOffsetCloneBlock(): void { 
        //
        var fixpos = this.cloneBlock.getPositions();
        for (var i = 0; i < fixpos.length; i++) {
            if (Math.abs(fixpos[i].x) > 0 && Math.abs(fixpos[i].x) < 0.1) { 
                fixpos[i].x = Math.floor(Math.abs(fixpos[i].x));
            }
            if (Math.abs(fixpos[i].y) > 0 && Math.abs(fixpos[i].y) < 0.1) {
                fixpos[i].y = Math.floor(Math.abs(fixpos[i].y));
            }
            if (Math.abs(fixpos[i].z) > 0 && Math.abs(fixpos[i].z) < 0.1) {          
                fixpos[i].z = Math.floor(Math.abs(fixpos[i].z));              
            }
        }
        // console.log(this.block.getPositions());
    }

    private fixRotationOffsetDummy(): void { 
        var fixpos = this.dummy.getPositions();
        
        for (var i = 0; i < fixpos.length; i++) {
            if (Math.abs(fixpos[i].x) > 0 && Math.abs(fixpos[i].x) < 0.1) { 
                fixpos[i].x = Math.floor(Math.abs(fixpos[i].x));
            }
            if (Math.abs(fixpos[i].y) > 0 && Math.abs(fixpos[i].y) < 0.1) {
                fixpos[i].y = Math.floor(Math.abs(fixpos[i].y));
            }
            if (Math.abs(fixpos[i].z) > 0 && Math.abs(fixpos[i].z) < 0.1) {          
                fixpos[i].z = Math.floor(Math.abs(fixpos[i].z));              
            }
        }
        // console.log(this.block.getPositions());
    }


}



export default Game;