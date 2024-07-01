import {Vector3, MeshBuilder,Scene,Mesh,Color4,Axis,Space
  } from '@babylonjs/core';

class Block {
    public positions: Vector3[];
    public parentCube!: Mesh;
    public cubes: Mesh[]; 
    public type!: string;
    public scene: Scene;

    constructor(cubeNum: number, scene: Scene) {
        this.positions = new Array(cubeNum);
        this.cubes = new Array(cubeNum - 1);
        this.scene = scene;
    }

    public createCube(ypos: number, xpos:number): Mesh {
        var cube = MeshBuilder.CreateBox("box", {size: 1}, this.scene);
        cube.position.y = ypos; 
        cube.position.x = xpos;
        cube = this.createEdges(cube);
        return cube;
    }

    private createEdges(cube: any): any { 
        cube.enableEdgesRendering();
        cube.edgesWidth = 5.0;
        cube.edgesColor = new Color4(0, 0, 0, 1); //black edges
        return cube;
    }

    public get position(): Vector3 { 
        return this.parentCube.position; 
    }

    public rotate(axis: string, rotation: number): void  { //if hasPivot - rotate around pivot instead (parent sphere)
        if (this.type !== "big cube") {
            switch(axis) {
                case "x":
                    this.parentCube.rotate(Axis.X, rotation, Space.WORLD);
                    break;
                case "y":
                    this.parentCube.rotate(Axis.Y, -rotation, Space.WORLD);
                    break;
                case "z":
                    this.parentCube.rotate(Axis.Z, -rotation, Space.WORLD);
                    break;
            }
        }      
    }

    public becomeChild(cube: Mesh ): Mesh {
        cube = this.parentCube.clone();
        cube = this.createEdges(cube);
        //cube.parent = this.parentCube;
        return cube;
    }

    public uncouple(): void { //use for loop? in block class? based on pos.length? use for getpositions
        //remove link between child and parent
        //each cube that makes up block will uncouple
        for (var i = 0; i < this.cubes.length; i++) {
            this.cubes[i].setParent(null); // example: this._cube2.setParent(null);
        }
        this.parentCube.setParent(null);
    }   

    public couple(): void { //use for loop? in block class? based on pos.length? use for getpositions
        //remove link between child and parent
        //each cube that makes up block will uncouple
        for (var i = 0; i < this.cubes.length; i++) {
            this.cubes[i].setParent(this.parentCube); // example: this._cube2.setParent(null);
        }
    }

    public getPositions(): Vector3[] { //will be overrided in sub classes
        return this.positions;
    }

    public getRelPos(): Vector3[] {
        return this.positions;
    }

    public setVisible(isVisible:boolean){
        this.parentCube.isVisible = false;
        for(var i = 0; i < this.cubes.length; i++){
            this.cubes[i].isVisible = isVisible;
        }
        //this.isVisible = isVisible;
    }

    public moveRelPosDown(): void  { 
        for(var i = 0; i < this.getRelPos().length;i++){
            this.getRelPos()[i].y -= 1;
        } 
    }

    public moveRelPosUp(): void  { 
        for(var i = 0; i < this.getRelPos().length;i++){
            this.getRelPos()[i].y += 1;
        } 
    }

    public moveRelPos(dir: string): void  { 
        var xstep = 0;
        var ystep = 0;
        var zstep = 0;

        switch (dir) {
            case "forward":
                zstep = 1;
                break;
            case "back":
                zstep = -1;
                break;
            case "right":
                xstep = 1;
                break;
            case "left":
                xstep = -1;
                break;
            case "down":
                ystep = -1;
                break;
            case "up":
                ystep = 1;
                break;    
                
        }

        for(var i = 0; i < this.getRelPos().length;i++){
            this.getRelPos()[i].x += xstep;
            this.getRelPos()[i].y += ystep;
            this.getRelPos()[i].z += zstep;
        }
    }

    public setRelPos(positions:Vector3[]): void  { 
        //console.log("x:",x + "y:",y + "z:",z);
        for(var i = 0; i < this.getRelPos().length;i++){
            this.getRelPos()[i].x = positions[i].x;
            this.getRelPos()[i].y = positions[i].y;
            this.getRelPos()[i].z = positions[i].z;
        } 
    }

    public setRelPosXYZ(x:number,y:number,z:number): void  {
        //console.log("+x:",x + "+y:",y + "+z:",z);
        
        for(var i = 0; i < this.getRelPos().length;i++){
            this.getRelPos()[i].x = this.getRelPos()[i].x + x ;
            this.getRelPos()[i].y = this.getRelPos()[i].y + y;
            this.getRelPos()[i].z = this.getRelPos()[i].z + z;
        } 
    }

}

export default Block;