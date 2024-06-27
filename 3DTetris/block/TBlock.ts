import {Vector3, HemisphericLight, MeshBuilder, Material, 
    Color3, ShadowGenerator, PointLight, DirectionalLight, StandardMaterial, 
    FreeCamera, MirrorTexture, RefractionTexture, Plane,
    ActionManager,InterpolateValueAction, SetValueAction, PredicateCondition,Scene,Mesh
  } from '@babylonjs/core';

import Block  from './Block';

class TBlock extends Block {
    private _cube2!: Mesh;
    private _cube3!: Mesh;
    private _cube4!: Mesh;

    constructor(scene:Scene) {
        super(4, scene);
        this.type = "t block";
        this.create();
        this.setCubes();
    }

    private create(): void {
        this.parentCube = this.createCube(5.5, 0); //middle, bottom

        var mat = new StandardMaterial("mat", this.scene);
        mat.diffuseColor = new Color3(0.7, 0.5, 0);
        mat.emissiveColor = new Color3(0.7, 0.3, 0); //orange
        this.parentCube.material = mat;
        this.parentCube.material.backFaceCulling = false;

        this._cube2 = this.becomeChild(this._cube2);
        this._cube3 = this.becomeChild(this._cube3);
        this._cube4 = this.becomeChild(this._cube4);

        this._cube2.parent = this.parentCube;
        this._cube2.position = new Vector3(-1, 0, 0); //left, bottom

        this._cube3.parent = this.parentCube;
        this._cube3.position = new Vector3(1, 0, 0); //right, bottom

        this._cube4.parent = this.parentCube;
        this._cube4.position = new Vector3(0, 1, 0); //middle, top
    }

    public getPositions(): Vector3[] {
        return [this.parentCube.position, this._cube2.getAbsolutePosition(), this._cube3.getAbsolutePosition(), this._cube4.getAbsolutePosition()];
    }

    public getRelPos(): Vector3[] {
        this.setPositions();
        return this.positions; 
    }

    private setPositions(): void {
        this.positions = [this.parentCube.position, this._cube2.position, this._cube3.position, this._cube4.position];
    }

    private setCubes(): void {
        this.cubes = [this._cube2, this._cube3, this._cube4];
    }

}

export default TBlock;