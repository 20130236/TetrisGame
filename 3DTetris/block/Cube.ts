/**
 * 2 x 2 Big Cube
 * drawn offset to the left, y = 5.5
 */
import {Vector3 , Color3, StandardMaterial, Scene,Mesh
} from '@babylonjs/core';

import Block  from './Block';

class Cube extends Block {
    private _cube2!: Mesh; //InstancedMesh;
    private _cube3!: Mesh;
    private _cube4!: Mesh;
    private _cube5!: Mesh;
    private _cube6!: Mesh;
    private _cube7!: Mesh;
    private _cube8!: Mesh;

    constructor(scene: Scene) {
        super(8, scene);
        this.type = "big cube";
        this.create();
        this.setCubes();
    }

    private create(): void {

        this.parentCube = this.createCube(5.5, -1); //offset position - parent: bottom,left,front _cube
        var mat = new StandardMaterial("mat", this.scene);
        mat.diffuseColor = new Color3(0.2, 0.28, 1);
        mat.emissiveColor = new Color3(0.2, 0.28, 1); //dark blue
        this.parentCube.material = mat;
        this.parentCube.material.backFaceCulling = false;

        this._cube2 = this.becomeChild(this._cube2);
        this._cube3 = this.becomeChild(this._cube3);
        this._cube4 = this.becomeChild(this._cube4);
        this._cube5 = this.becomeChild(this._cube5);
        this._cube6 = this.becomeChild(this._cube6);
        this._cube7 = this.becomeChild(this._cube7);
        this._cube8 = this.becomeChild(this._cube8);

        //this.parentCube = this.createCube(5.5, -1);
        //this._cube2 = this.parentCube.clone();
        this._cube2.parent = this.parentCube;
        this._cube2.position = new Vector3(0, 0, 1); //bottom,left,back

        this._cube3.parent = this.parentCube;
        this._cube3.position = new Vector3(1, 0, 1); //bottom,right,back

        this._cube4.parent = this.parentCube;
        this._cube4.position = new Vector3(1, 0, 0); //bottom,right,front

        this._cube5.parent = this.parentCube;
        this._cube5.position = new Vector3(0, 1, 0); //top,left,front
        
        this._cube6.parent = this.parentCube;
        this._cube6.position = new Vector3(0, 1, 1); //top,left,back

        this._cube7.parent = this.parentCube;
        this._cube7.position = new Vector3(1, 1, 1); //top,right,back
        
        this._cube8.parent = this.parentCube;
        this._cube8.position = new Vector3(1, 1, 0); //top,right,front
    }
    
    public getPositions(): Vector3[] { //now retrieving absolute position in world space
        return [this.parentCube.position, this._cube2.getAbsolutePosition(), this._cube3.getAbsolutePosition(), this._cube4.getAbsolutePosition(), 
                this._cube5.getAbsolutePosition(), this._cube6.getAbsolutePosition(), this._cube7.getAbsolutePosition(), this._cube8.getAbsolutePosition()];
    }

    public getRelPos(): Vector3[] {
        this.setPositions();
        return this.positions;
    }

    private setPositions(): void {
        this.positions = [this.parentCube.position, this._cube2.position, this._cube3.position, this._cube4.position,
                            this._cube5.position, this._cube6.position, this._cube7.position, this._cube8.position];
    }

    private setCubes(): void {
        this.cubes = [this._cube2, this._cube3, this._cube4, this._cube5, this._cube6, this._cube7, this._cube8];
    }
}

export default Cube;