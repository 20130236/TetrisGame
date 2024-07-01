import {Vector3, HemisphericLight, MeshBuilder, Material, 
    Color3, ShadowGenerator, PointLight, DirectionalLight, StandardMaterial, 
    FreeCamera, MirrorTexture, RefractionTexture, Plane,
    ActionManager,InterpolateValueAction, SetValueAction, PredicateCondition,Scene,Mesh,Color4,Axis,Space
  } from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';
import Block from './block/Block';
import _ from 'lodash';

class GameBoard {
    private _size: number;
    private _height!: number;
    private _ground!: Mesh;
    private _spaces!: any[];
    private _positions!: Vector3[];
    private _groundlvl!: number;
    private _scene: Scene;

    constructor(size: number, scene: Scene) {
        this._size = size;
        this.create();
        this.fillSpaces();
        this.fillPositions();
        this._scene = scene;

    }

    private create(): void {
        var groundGrid = this.createGrid();
        groundGrid.backFaceCulling = false;
    
        var ground = MeshBuilder.CreateGround("ground", 
            {width: this._size, height: this._size}, this._scene);
        ground.position.y = -5;
        ground.material = groundGrid;
        ground.position.y = (this._size === 7) ? -6 : -5;
        this._groundlvl = ground.position.y + 0.5;
        this._ground = ground;

        //front & back 
        var fplane = this.createPlane(0, 0, -this._size/2, Math.PI);
        var bplane = this.createPlane(0, 0, this._size/2, 0);

        //right & left 
        var rplane = this.createPlane(this._size/2, 0, 0, Math.PI / 2);
        var lplane = this.createPlane(-this._size/2, 0, 0, -Math.PI/2);
        

    }

    private createGrid(): GridMaterial {
        var grid = new GridMaterial("grid", this._scene);
        grid.lineColor = Color3.White();
        grid.majorUnitFrequency = 1;
        grid.opacity = 0.85; 
        grid.gridOffset = new Vector3(0.5, 0, 0.5);
        return grid;
    }

    private createPlane(x: number, y: number, z: number, rotation: number): Mesh {
        this._height = (this._size === 7) ? 12 : 10; //12 if 7, 10 
        var plane = MeshBuilder.CreatePlane("plane", {height: this._height, width: this._size}, this._scene);
        plane.position.x = x;
        plane.position.y = y;
        plane.position.z = z;
        plane.rotation.y = rotation;

        var planeGrid = this.createGrid();
        planeGrid.backFaceCulling = true;
        plane.material = planeGrid;

        return plane;
    }

    public get size(): number {
        return this._size;
    }

    public get height(): number {
        return this._height;
    }

    public get ground(): Mesh {
        return this._ground;
    }

    public get groundlvl(): number {
        return this._groundlvl;
    }
    
    private fillSpaces(): void { 
        
        var spaces = new Array(this._size); //x - length
        
        for (var x = 0; x < this._size; x++) { //fill x empty arrays w/ y-arrays
            spaces[x] = new Array(this._height); //y - height

            for (var y = 0; y < this._height; y++) { //fill y arrs w/ z-arrs
                spaces[x][y] = new Array(this._size); //z - width

                for (var z = 0; z < this._size; z++) { //fill z-arrs w/z # of elements
                    spaces[x][y][z] = false; //false - space/position not occupied
                }
            }
        }

        this._spaces = spaces;
    }


    public get spaces(): any[] {
        return this._spaces;
    }

    private fillPositions(): void {

        // vị trí tại 0,0,0
        var origin = new Vector3(-Math.floor(this._size/2), (this._height/2)-0.5, Math.floor(this._size/2));

        // y+=1 -> giảm y index; z+=1 -> giảm z index; x+=1 -> tăng 1 x index
        var positions = new Array(this._size);
        var xpos = origin.x;

        for (var x = 0; x < this._size; x++) {
            positions[x] = new Array(this._height);
            var ypos = origin.y;

            for (var y = 0; y < this._height; y++) {
                positions[x][y] = new Array(this._size)
                var zpos = origin.z;

                for (var z = 0; z < this._size; z++) {
                    positions[x][y][z] = new Vector3(xpos, ypos, zpos);
                    zpos--;
                }
                ypos--;
            }
            xpos++;
        }

        this._positions = positions;
    }

    public get positions(): any[] {
        return this._positions;
    }

    // block vẫn trong trong gameboard khi vị trí của các cube vẫn ở trong gameboard
    public inGrid(blockpos: Vector3[]): boolean { 
        // var inBounds: boolean;
        // var tracker = 0; //
        // for (var x = 0; x < this._size; x++) {
        //     for (var y = 0; y < this._height; y++) {
        //         for (var z = 0; z < this._size; z++) {

        //             for (var i = 0; i < blockpos.length; i++) {
        //                 inBounds = this.compare(blockpos[i], x, y, z);
        //                 if (inBounds) { //if there is a match
        //                     tracker++;
        //                 }
        //                
        //             }
        //         }
        //     }
        // }

        // var inside = true;
        // var tracker2 = 0;
        // for (var i = 0; i < blockpos.length; i++) {
        //     if ( Math.abs(blockpos[i].x) > Math.floor(this._size/2) || 
        //             Math.abs(blockpos[i].y) > ((this._height/2)-0.5) || Math.abs(blockpos[i].z) > Math.floor(this._size/2)) {
        //         inside = false;
        //         tracker2++;
        //     }
        // }

        
        // //if tracker (tracks when true) = blockpos.length (found matches for each element), return true
        // if (tracker === blockpos.length || tracker2 === 0) { 
        //     console.log("true");
        //     return true;
        // }
        // // else if (inside) {
        // //     return true;
        // // }

        // return false; /

        for (var i = 0; i < blockpos.length; i++) {
            if ( Math.abs(blockpos[i].x) > Math.floor(this._size/2) || 
                    Math.abs(blockpos[i].y) > ((this._height/2)-0.5) || Math.abs(blockpos[i].z) > Math.floor(this._size/2)) {
                return false;
            }
        }
        return true; 
    }

    public inGridXZ(blockpos: Vector3[]): boolean { 

        for (var i = 0; i < blockpos.length; i++) {
            if ( Math.abs(blockpos[i].x) > Math.floor(this._size/2) || 
                Math.abs(blockpos[i].z) > Math.floor(this._size/2)) {
                return false;
            }
        }
        return true; 
    }

    public inGrid2(blockpos: Vector3[]): boolean { 
        
        for (var i = 0; i < blockpos.length; i++) {
            if ( Math.abs(blockpos[i].x) > Math.floor(this._size/2) || 
                    Math.abs(blockpos[i].y) > ((this._height/2)-0.5) || Math.abs(blockpos[i].z) > Math.floor(this._size/2)) {
                return false;
            }
        }
        return true; 
    }

    // kiểm tra vị trí tiếp theo của block có ra ngoài hay đụng chạm ko?
    // nếu có ko move dc, ko cho move 
    public canMove(blockpos: Vector3[], dir: string): boolean { 
        var clonePos = this.cloningPositions(blockpos);
        
        console.log("clonePos",clonePos);

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
        }

        for (var i = 0; i < clonePos.length; i++) {
            clonePos[i].x += xstep;
            clonePos[i].y += ystep;
            clonePos[i].z += zstep;
        }

        if (this.inGrid(clonePos) && this.isOccupied(clonePos) == false) {
            return true; 
        }
        return false;
    }

    
    private cloningPositions(positions:Vector3[]):Vector3[]{
        var result:Vector3[] = new Array();
        for(var postition of positions){
            result.push(new Vector3(postition.x,postition.y,postition.z));
        }
        return result;
    }

    public canMoveWhenOutGrid(blockpos: Vector3[], dir: string): boolean { 
        var potential = this.cloningPositions(blockpos);

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
        }

        for (var i = 0; i < potential.length; i++) {
            // potential[i] = blockpos[i];
            potential[i].x += xstep;
            potential[i].y += ystep;
            potential[i].z += zstep;
        }
        //this._scene.render();
        //console.log("blockpos", blockpos.toString());
        //console.log("potential2", potential2.toString());
        //console.log("potential_y", potential[0]._y);
        //console.log("potential", potential);
        if (!this.isOccupiedWhenOutGrid(potential)) {
            return true; 
        }
        return false;
    }

    // check dụng chạm block trong game 
    public isOccupied(potential: Vector3[]): boolean { 

        var orignX = Math.floor(this._size/2);
        var orignY = (this._height/2)-0.5;
        var orignZ = Math.floor(this._size/2);

        for (var i = 0; i < potential.length; i++) {

            // position của bloack trừ đi vị trí ban đầu => index của space tương ứng
            var x = Math.abs(potential[i].x + orignX);
            var y = Math.abs(potential[i].y - orignY);
            var z = Math.abs(potential[i].z - orignZ);

            if (this._spaces[x][y][z] === true) {
                return true;
            }
        }
        return false;
    }
    
    public isOccupiedWhenOutGrid(potential: Vector3[]): boolean{
        for (var x = 0; x < this._size; x++) {
            for (var y = 0; y < this._height; y++) {
                for (var z = 0; z < this._size; z++) {

                    //current and potential arrays have same length - they store positions of same block
                    for (var i = 0; i < potential.length; i++) {
                        //find position in potential non-overlapping w/current
                        //dont check spaces that block currently occupies, only check potential positions that block doesnt occupy
                        if (this.compare(potential[i], x, y, z) === true) {
                            //position array el dont match any of current's els AND pos arr's el = potential el
                            //console.log("this.space[x][y][z]" + this._spaces[x][y][z])
                            if (this._spaces[x][y][z] === true) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        // 
        //if any space to be occupied by block already true - return true
        //if space isn't already occupied, return false
        return false;
    }

    public isOccupied3(potential: Vector3[]): boolean{
        
                        //5.5 , 4.5
                        // index y = 0 => y positon = 5.0
                        // y = 1 => position = 4.5
                        // y = 2 => pos 3.5
                        // y position = 4.5 => y index = 1.0
                        // y pos = 6
                        // -5.0 -5.0 = y = 10
                        // y = 10, 10 - 5.5 = 
                        
                        //-1 , 
                        // index x = 0 => x positon = -1
                        // x = 1 => position = 0
                        // y = 2 => pos 3.5
                        // y position = 4.5 => y index = 1.0
                        // y pos = 6 
        var orignX = Math.floor(this._size/2);
        var orignY = (this._height/2)-0.5;
        var orignZ = Math.floor(this._size/2);

        //console.log("potential", potential);
        for (var i = 0; i < potential.length; i++) {
            var x = Math.abs(potential[i].x + orignX);
            var y = Math.abs(potential[i].y - orignY);
            var z = Math.abs(potential[i].z - orignZ);
            
            // console.log("index x",x);
            // console.log("index y",y);
            // console.log("index z",z);

            if (this._spaces[x][y][z] === true) {
                return true;
            }
        }
        return false;
    }

    // sử dụng để cập nhật lại space sau khi block chạm dáy hoặc clear hàng
    public updateSpaces(position: Vector3[]): void { 
        for (var x = 0; x < this._size; x++) {
            for (var y = 0; y < this._height; y++) {
                for (var z = 0; z < this._size; z++) {
                    for (var i = 0; i < position.length; i++) {
                        if (this.compare(position[i], x, y, z) === true) {
                            this._spaces[x][y][z] = true; 
                        }
                    }   
                }
            }
        }
    }

    // kiểm tra position của block có trong position của gameboard ko?
    // nếu ko nó có thể đang ở ngoài gameboard
    public compare(position: Vector3, x: number, y: number, z: number): boolean {
        var match = this._positions[x][y][z].x === position.x && this._positions[x][y][z].y === position.y 
                    && this._positions[x][y][z].z === position.z;
        return match;
    }
    
}

export default GameBoard;