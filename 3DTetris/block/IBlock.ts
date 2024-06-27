import {Vector3 , Color3, StandardMaterial, Scene,Mesh
} from '@babylonjs/core';

import Block  from './Block';

class IBlock extends Block {
    private _cube2!: Mesh; //InstancedMesh;
    private _cube3!: Mesh;
    private _cube4!: Mesh;
    // private _pivot: Mesh;

    constructor(scene: Scene) {
        super(4, scene);
        this.type = "big tower";
        this.create();
        this.setCubes();
    }

    private create(): void {
        this.parentCube = this.createCube(6.5, 0); //2nd _cube from bottom

        var mat = new StandardMaterial("mat", this.scene);
        mat.diffuseColor = new Color3(0, 0.5, 0.5);
        mat.emissiveColor = new Color3(0.5, 1, 0.2); //green
        this.parentCube.material = mat;
        this.parentCube.material.backFaceCulling = false;

        this._cube2 = this.becomeChild(this._cube2);
        this._cube3 = this.becomeChild(this._cube3);
        this._cube4 = this.becomeChild(this._cube4);

        this._cube2.parent = this.parentCube;
        this._cube2.position.y = 2;
        
        this._cube3.parent = this.parentCube;
        this._cube3.position.y = 1;

        this._cube4.parent = this.parentCube;
        this._cube4.position.y = -1;
        
    }

    public getPositions(): Vector3[] { 
        return [this.parentCube.position, this._cube2.getAbsolutePosition(), this._cube3.getAbsolutePosition(), this._cube4.getAbsolutePosition()];
    }

    public getRelPos(): Vector3[] {
        this.setPositions();
        return this.positions; //gives relative positions (because _cubes still parented), except cant get rel pos of parent _cube...
    }

    private setPositions(): void {
        // this.uncouple();
        this.positions = [this.parentCube.position, this._cube2.position, this._cube3.position, this._cube4.position];

        // let pos = [this.parentCube.position, this._cube2.position, this._cube3.position, this._cube4.position];
        // let cloned = JSON.parse(JSON.stringify(pos)); //deep copy, not just reference to array
        // this.positions = cloned;

        // this.recouple();

        //before uncoupling: instanced meshes give positions relative to parent! CHANGE
    }

    private setCubes(): void {
        this.cubes = [this._cube2, this._cube3, this._cube4];
    }
}

export default IBlock;