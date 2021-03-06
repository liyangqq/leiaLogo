'use strict';
var LEIA = {};
LEIA.REVISION = "0.0.35";
LEIA.view_angles = [
    [-.389, .389, .835],
    [-.289, .405, .868],
    [-.178, .416, .892],
    [-.06, .422, .905],
    [.06, .422, .905],
    [.178, .416, .892],
    [.289, .405, .868],
    [.389, .389, .835],
    [-.405, .289, .868],
    [-.301, .301, .905],
    [-.186, .31, .932],
    [-.063, .315, .947],
    [.063, .315, .947],
    [.186, .31, .932],
    [.301, .301, .905],
    [.405, .289, .868],
    [-.416, .178, .892],
    [-.31, .186, .932],
    [-.192, .192, .962],
    [-.065, .196, .979],
    [.065, .196, .979],
    [.192, .192, .962],
    [.31, .186, .932],
    [.416, .178, .892],
    [-.422, .06, .905],
    [-.315, .063, .947],
    [-.196, .065, .979],
    [-.066, .066, .996],
    [.066, .066, .996],
    [.196, .065, .979],
    [.315, .063, .947],
    [.422, .06, .905],
    [-.422, -.06, .905],
    [-.315, -.063, .947],
    [-.196, -.065, .979],
    [-.066, -.066, .996],
    [.066, -.066, .996],
    [.196, -.065, .979],
    [.315, -.063, .947],
    [.422, -.06, .905],
    [-.416, -.178, .892],
    [-.31, -.186, .932],
    [-.192, -.192, .962],
    [-.065, -.196, .979],
    [.065, -.196, .979],
    [.192, -.192, .962],
    [.31, -.186, .932],
    [.416, -.178, .892],
    [-.405, -.289, .868],
    [-.301, -.301, .905],
    [-.186, -.31, .932],
    [-.063, -.315, .947],
    [.063, -.315, .947],
    [.186, -.31, .932],
    [.301, -.301, .905],
    [.405, -.289, .868],
    [-.389, -.389, .835],
    [-.289, -.405, .868],
    [-.178, -.416, .892],
    [-.06, -.422, .905],
    [.06, -.422, .905],
    [.178, -.416, .892],
    [.289, -.405, .868],
    [.389, -.389, .835]
];
LEIA.fov = 50;
LEIA.DeltaTheta = .1;
LEIA.Disparity = 10;
LEIA.SimCanvasWidth = 3200;
LEIA.SimCanvasHeight = 2400;
LEIA.DeviceResolutionWidth = 200;
LEIA.DeviceResolutionHeight = 150;
LEIA.time = 0;
LEIA.SSBFilterEle_a = .5;
LEIA.SXYFilterEle_b = -.21;
LEIA.SXYFilterEle_c = -.06;
var LeiaCamera = function(parameters) {
    parameters = parameters || {};
    THREE.PerspectiveCamera.call(this, parameters.fov, parameters.aspect, parameters.near, parameters.far);
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    if (parameters.cameraPosition != undefined) this.position.copy(parameters.cameraPosition);
    if (parameters.targetPosition != undefined) {
        var m1 = new THREE.Matrix4;
        this.targetPosition = parameters.targetPosition;
        m1.lookAt(this.position, this.targetPosition, this.up);
        this.quaternion.setFromRotationMatrix(m1)
    }
};
LeiaCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
LeiaCamera.prototype.lookAt = function() {
    var m1 = new THREE.Matrix4;
    return function(vector) {
        this.targetPosition = vector;
        m1.lookAt(this.position, vector, this.up);
        this.quaternion.setFromRotationMatrix(m1)
    }
}();
LeiaCamera.prototype.clone = function(camera) {
    if (camera === undefined) camera = new LeiaCamera;
    THREE.PerspectiveCamera.prototype.clone.call(this, camera);
    camera.targetPosition.copy(this.targetPosition);
    return camera
};
var CGyroView = function(parameters) {
    parameters = parameters || {};
    var renderer = parameters.renderer;
    var renderTarget = parameters.renderTarget;
    var forceClear = parameters.forceClear;
    var canvasWidth = parameters.canvasWidth;
    var canvasHeight = parameters.canvasHeight;
    this.init = function() {
        this.GyroSimCam = new THREE.PerspectiveCamera(90, canvasWidth / canvasHeight, .01, 1E4);
        this.GyroSimCam.position.x = 0;
        this.GyroSimCam.position.y = 0;
        this.GyroSimCam.position.z = 20;
        this.GyroSimCam.up.x = 0;
        this.GyroSimCam.up.y = 1;
        this.GyroSimCam.up.z =
            0;
        this.GyroSimScene = new THREE.Scene;
        this.GyroSimCam.lookAt(this.GyroSimScene.position);
        this.GyroSimScene.add(this.GyroSimCam);
        var boxScale = 1;
        var boxX = 10,
            boxY = 2,
            boxZ = 10;
        var geoBox = new THREE.BoxGeometry(boxX * boxScale, boxY * boxScale, boxZ * boxScale);
        var materBox = new THREE.MeshPhongMaterial({
            color: 11184810,
            transparent: true,
            opacity: .8,
            specular: 15658751,
            shininess: 20
        });
        this.GyroBox = new THREE.Mesh(geoBox, materBox);
        this.GyroSimScene.add(this.GyroBox);
        this.localSim = new simulateGyro(canvasWidth, canvasHeight);
        var light =
            new THREE.DirectionalLight(16777215);
        light.position.set(0, 5, 5);
        this.GyroSimScene.add(light);
        renderer.GyroRealRoll = 0;
        renderer.GyroRealPitch = 0;
        renderer.GyroRealYaw = 0;
        renderer.GyroSimRoll = 0;
        renderer.GyroSimPitch = 0;
        renderer.GyroSimYaw = 0
    };
    this.init();
    this.update = function() {
        var _left = Math.floor(canvasWidth * GGyroSimView.left);
        var _bottom = Math.floor(canvasHeight * GGyroSimView.bottom);
        var _width = Math.floor(canvasWidth * GGyroSimView.width);
        var _height = Math.floor(canvasHeight * GGyroSimView.height);
        renderer.setViewport(_left,
            _bottom, _width, _height);
        renderer.setScissor(_left, _bottom, _width, _height);
        renderer.enableScissorTest(true);
        renderer.setClearColor((new THREE.Color).setRGB(.11, .12, .18));
        this.GyroSimCam.aspect = _width / _height;
        this.GyroSimCam.updateProjectionMatrix();
        this.localSim.update();
        renderer.GyroSimRoll = this.localSim.GyroSimRoll;
        renderer.GyroSimPitch = this.localSim.GyroSimPitch;
        renderer.GyroSimYaw = this.localSim.GyroSimYaw;
        this.GyroBox.quaternion.setFromEuler(new THREE.Euler(THREE.Math.degToRad(this.localSim.GyroSimRoll +
            renderer.GyroRealRoll), 0, THREE.Math.degToRad(this.localSim.GyroSimPitch + renderer.GyroRealPitch)));
        renderer.render(this.GyroSimScene, this.GyroSimCam, renderTarget, forceClear)
    }
};
var GGyroSimView = {
    left: .75,
    bottom: .5,
    width: .25,
    height: .25,
    up: [0, 1, 0]
};
var simulateGyro = function(canvasWidth, canvasHeight) {
    var _this = this;
    this.screen = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };
    this.screen.left = canvasWidth * GGyroSimView.left;
    this.screen.top = canvasHeight * (1 - GGyroSimView.bottom - GGyroSimView.height);
    this.screen.width = canvasWidth * GGyroSimView.width;
    this.screen.height = canvasHeight * GGyroSimView.height;
    var _lastPos = new THREE.Vector2;
    var _accuDelta = new THREE.Vector2;
    var getMouseOnScreen = function() {
        var vector = new THREE.Vector2;
        return function(layerX, layerY) {
            vector.set((layerX -
                _this.screen.left) / _this.screen.width, (layerY - _this.screen.top) / _this.screen.height);
            return vector
        }
    }();

    function mousedown(event) {
        var leftBunder = _this.screen.left;
        var rightBunder = _this.screen.left + _this.screen.width;
        var topBunder = _this.screen.top;
        var bottomBunder = _this.screen.top + _this.screen.height;
        if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
            _lastPos.copy(getMouseOnScreen(event.layerX, event.layerY));
            document.addEventListener("mousemove",
                mousemove, false);
            document.addEventListener("mouseup", mouseup, false)
        }
    }

    function mousemove(event) {
        var leftBunder = _this.screen.left;
        var rightBunder = _this.screen.left + _this.screen.width;
        var topBunder = _this.screen.top;
        var bottomBunder = _this.screen.top + _this.screen.height;
        if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
            event.preventDefault();
            var _curPos = new THREE.Vector2;
            _curPos.copy(getMouseOnScreen(event.layerX, event.layerY));
            var _deltaPos = new THREE.Vector2;
            _accuDelta.add(_deltaPos.subVectors(_curPos, _lastPos));
            _lastPos.copy(_curPos)
        }
    }

    function mouseup(event) {
        var leftBunder = _this.screen.left;
        var rightBunder = _this.screen.left + _this.screen.width;
        var topBunder = _this.screen.top;
        var bottomBunder = _this.screen.top + _this.screen.height;
        if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
            document.removeEventListener("mousemove", mousemove);
            document.removeEventListener("mouseup", mouseup)
        }
        document.removeEventListener("mousemove",
            mousemove);
        document.removeEventListener("mouseup", mouseup)
    }
    this.update = function() {
        this.screen.left = canvasWidth * GGyroSimView.left;
        this.screen.top = canvasHeight * (1 - GGyroSimView.bottom - GGyroSimView.height);
        this.screen.width = canvasWidth * GGyroSimView.width;
        this.screen.height = canvasHeight * GGyroSimView.height;
        this.GyroSimRoll = _accuDelta.y * 30;
        this.GyroSimPitch = _accuDelta.x * -30;
        this.GyroSimYaw = 0
    };
    document.addEventListener("mousedown", mousedown, false);
    this.update()
};
var DepthCompress = function(compFac) {
    var _compressScale = compFac;
    var nMarked = 0;
    this.markCandidates = function(_scene) {
        if (nMarked == 0 && _compressScale !== 1) {
            var bHasCam = false;
            var obj, subObj, tarId;
            for (var _i = 0, _l = _scene.children.length; _i < _l; _i++) {
                obj = _scene.children[_i];
                if (obj == camera) bHasCam = true
            }
            if (!bHasCam)
                for (var _ii = 0, _ll = _scene.children.length; _ii < _ll; _ii++) {
                    obj = _scene.children[_ii];
                    for (var _jj = 0, lll = obj.children.length; _jj < lll; _jj++) {
                        subObj = obj.children[_jj];
                        if (subObj == camera) tarId = _ii
                    }
                }
            _scene.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    var oldname = child.name;
                    child.name = oldname + "LeiaMesh"
                }
            });
            if (bHasCam || tarId == undefined);
            else _scene.children[tarId].name = " "
        }
        nMarked = 1
    };
    this.applyCompress = function(_camera, _scene) {
        if (_compressScale !== 1) {
            var compressVec = new THREE.Vector3(0, 0, 1);
            renderer._holoScreen.tarObj.updateMatrixWorld();
            var tmpMat = new THREE.Matrix4;
            compressVec.applyMatrix4(tmpMat.extractRotation(_camera.matrixWorld));
            compressVec.normalize();
            var compressX, compressY, compressZ;
            if (compressVec.x > .8) compressX = compressVec.x *
                _compressScale;
            else compressX = 1; if (compressVec.y > .8) compressY = compressVec.y * _compressScale;
            else compressY = 1; if (compressVec.z > .8) compressZ = compressVec.z * _compressScale;
            else compressZ = 1;
            var matCompress = new THREE.Matrix4;
            //var m11 = compressX;
            //var m12 = 0;
            //var m13 = 0;
            //var m14 = 0;
            //var m21 = 0;
            //var m22 = compressY;
            //var m23 = 0;
            //var m24 = 0;
            //var m31 = 0;
            //var m32 = 0;
            //var m33 = compressZ;
            //var m34 = 0;
            //var m41 = 0;
            //var m42 = 0;
            //var m43 = 0;
            //var m44 = 1;
            var m11 = 1;
            var m12 = 0;
            var m13 = 0;
            var m14 = -_tarPosition.x;
            var m21 = 0;
            var m22 = 1;
            var m23 = 0;
            var m24 = -_tarPosition.y;
            var m31 = 0;
            var m32 = 0;
            var m33 = 1;
            var m34 = -_tarPosition.z;
            var m41 = 0;
            var m42 = 0;
            var m43 = -1/_compressScale;
            var m44 = 1;
            matCompress.set(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
            _scene.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    var childName = child.name;
                    if (childName !== "selectable_obj" && child.leiaType !== 1) {
                        child.updateMatrix();
                        child.updateMatrixWorld();
                        var matComp = new THREE.Matrix4;
                        matComp.copy(matCompress);
                        matComp.multiply(child.matrixWorld);
                        var invMatW = new THREE.Matrix4;
                        invMatW.getInverse(child.parent.matrixWorld);
                        invMatW.multiply(matComp);
                        child.matrixAutoUpdate = false;
                        child.matrixWorldNeedsUpdate = true;
                        child.matrix = invMatW
                    }
                }
            })
        }
    };
    this.applyCompressToNewlyMesh = function(_camera, _scene) {
        var compressVec = new THREE.Vector3(0,
            0, 1);
        renderer._holoScreen.tarObj.updateMatrixWorld();
        var tmpMat = new THREE.Matrix4;
        compressVec.applyMatrix4(tmpMat.extractRotation(_camera.matrixWorld));
        compressVec.normalize();
        var compressX, compressY, compressZ;
        if (compressVec.x > .8) compressX = compressVec.x * _compressScale;
        else compressX = 1; if (compressVec.y > .8) compressY = compressVec.y * _compressScale;
        else compressY = 1; if (compressVec.z > .8) compressZ = compressVec.z * _compressScale;
        else compressZ = 1;
        var matCompress = new THREE.Matrix4;
        var m11 = compressX;
        var m12 = 0;
        var m13 =
            0;
        var m14 = 0;
        var m21 = 0;
        var m22 = compressY;
        var m23 = 0;
        var m24 = 0;
        var m31 = 0;
        var m32 = 0;
        var m33 = compressZ;
        var m34 = 0;
        var m41 = 0;
        var m42 = 0;
        var m43 = 0;
        var m44 = 1;
        matCompress.set(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44);
        _scene.traverse(function(child) {
            if (child.name == "LeiaMesh") {
                child.updateMatrix();
                child.updateMatrixWorld();
                var matComp = new THREE.Matrix4;
                matComp.copy(matCompress);
                matComp.multiply(child.matrixWorld);
                var invMatW = new THREE.Matrix4;
                invMatW.getInverse(child.matrixWorld);
                invMatW.multiply(matComp);
                child.matrixAutoUpdate = false;
                child.matrixWorldNeedsUpdate = true;
                child.matrix = invMatW;
                child.name = "null"
            }
        })
    }
};
var CGlobalView = function(parameters) {
    parameters = parameters || {};
    var renderer = parameters.renderer;
    var camera = parameters.camera;
    var scene = parameters.scene;
    var renderTarget = parameters.renderTarget;
    var forceClear = parameters.forceClear;
    var canvasWidth = parameters.canvasWidth;
    var canvasHeight = parameters.canvasHeight;
    var npart = 8;
    this.camMeshs64 = [];
    this.ObjMesh2 = [];
    this.Gcamera = new THREE.PerspectiveCamera(90, canvasWidth / canvasHeight, .01, 4E4);
    this.selectedView = new THREE.Vector2(-1, -1);
    this.GcamPerserve = new THREE.PerspectiveCamera;
    this.GcamTinyView = new THREE.PerspectiveCamera;
    this.GObserveView = {
        left: 0,
        bottom: 0,
        width: 1,
        height: 1,
        up: [0, 1, 0]
    };
    this.init = function() {
        var vecCend = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        var vecGT = new THREE.Vector3((camera.position.x + camera.targetPosition.x) / 2, (camera.position.y + camera.targetPosition.y) / 2, (camera.position.z + camera.targetPosition.z) / 2);
        vecCend.x -= vecGT.x;
        vecCend.y -= vecGT.y;
        vecCend.z -= vecGT.z;
        var vecUp = new THREE.Vector3(0, -vecCend.z, vecCend.y);
        var lengthVecUp =
            Math.sqrt(vecUp.x * vecUp.x + vecUp.y * vecUp.y + vecUp.z * vecUp.z);
        vecUp.x /= lengthVecUp;
        vecUp.y /= lengthVecUp;
        vecUp.z /= lengthVecUp;
        var __length = Math.sqrt(vecCend.x * vecCend.x + vecCend.y * vecCend.y + vecCend.z * vecCend.z);
        var sceneSize = renderer._holoScreen.sizeX;
        vecUp.x = vecUp.x * 2 * __length + vecGT.x;
        vecUp.y = vecUp.y * 2 * __length + vecGT.y;
        vecUp.z = vecUp.z * 2 * __length + vecGT.z;
        this.Gcamera = new THREE.PerspectiveCamera(90, canvasWidth / canvasHeight, .01, 4E4);
        this.Gcamera.position.x = vecUp.x * sceneSize / __length / 2;
        this.Gcamera.position.y =
            vecUp.y * sceneSize / __length / 2;
        this.Gcamera.position.z = vecUp.z * sceneSize / __length / 2;
        this.Gcamera.up.x = vecCend.x;
        this.Gcamera.up.y = vecCend.y;
        this.Gcamera.up.z = vecCend.z;
        this.Gcamera.lookAt(new THREE.Vector3(vecGT.x, vecGT.y, vecGT.z));
        this.GcamPerserve = this.Gcamera.clone();
        this.GcamTinyView = this.Gcamera.clone();
        this.GcamTinyView.up.set(camera.up.x, camera.up.y, camera.up.z);
        this.GcamTinyView.lookAt(new THREE.Vector3(vecGT.x, vecGT.y, vecGT.z));
        scene.add(this.Gcamera);
        this.LocalControls = new dragControls(this.Gcamera);
        this.LocalControls.screen.left = 0;
        this.LocalControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.LocalControls.screen.width = canvasWidth * this.GObserveView.width;
        this.LocalControls.screen.height = canvasHeight * this.GObserveView.height;
        this.camControls = new pickControls(this.Gcamera, undefined, sceneSize / 8);
        this.camControls.view64fov = renderer._holoCamCenter.fov;
        this.camControls.spanSphereMode = renderer._holoCamCenter.spanSphereMode;
        this.camControls.screen.left = 0;
        this.camControls.screen.top =
            canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.camControls.screen.width = canvasWidth * this.GObserveView.width;
        this.camControls.screen.height = canvasHeight * this.GObserveView.height;
        this.tarControls = new pickControls(this.Gcamera, undefined, sceneSize / 8);
        this.tarControls.screen.left = 0;
        this.tarControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.tarControls.screen.width = canvasWidth * this.GObserveView.width;
        this.tarControls.screen.height = canvasHeight *
            this.GObserveView.height;
        this.upPlaneControls = new pickControls(this.Gcamera, undefined, sceneSize / 15);
        this.upPlaneControls.screen.left = 0;
        this.upPlaneControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.upPlaneControls.screen.width = canvasWidth * this.GObserveView.width;
        this.upPlaneControls.screen.height = canvasHeight * this.GObserveView.height;
        this.downPlaneControls = new pickControls(this.Gcamera, undefined, sceneSize / 15);
        this.downPlaneControls.screen.left = 0;
        this.downPlaneControls.screen.top =
            canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.downPlaneControls.screen.width = canvasWidth * this.GObserveView.width;
        this.downPlaneControls.screen.height = canvasHeight * this.GObserveView.height;
        this.camPlaneTrackControls = new trackPadControls(this.GcamTinyView, undefined, renderer._holoCamCenter.camPlane);
        this.camPlaneTrackControls.screen.left = 0;
        this.camPlaneTrackControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.camPlaneTrackControls.screen.width =
            canvasWidth * this.GObserveView.width;
        this.camPlaneTrackControls.screen.height = canvasHeight * this.GObserveView.height;
        var bHasCam = false;
        var obj, subObj, tarId;
        for (var _i = 0, _l = scene.children.length; _i < _l; _i++) {
            obj = scene.children[_i];
            if (obj == camera) bHasCam = true
        }
        if (!bHasCam)
            for (var _ii = 0, _ll = scene.children.length; _ii < _ll; _ii++) {
                obj = scene.children[_ii];
                for (var _jj = 0, lll = obj.children.length; _jj < lll; _jj++) {
                    subObj = obj.children[_jj];
                    if (subObj == camera) tarId = _ii
                }
            }
        var spanM = renderer._holoCamCenter.spanSphereMode;
        for (var i = 0; i < npart; i++)
            for (var j = 0; j < npart; j++) {
                var mesh = new selectControls(this.Gcamera, undefined, __length, i, j);
                mesh.screen.left = 0;
                mesh.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
                mesh.screen.width = canvasWidth * this.GObserveView.width;
                mesh.screen.height = canvasHeight * this.GObserveView.height;
                var Gradient = new THREE.Vector3;
                var EachTarPos = new THREE.Vector3;
                var meshPosition = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient,
                    EachTarPos, spanM);
                mesh.position.x = meshPosition.x;
                mesh.position.y = meshPosition.y;
                mesh.position.z = meshPosition.z;
                mesh.lookAt(EachTarPos);
                this.camMeshs64.push(mesh);
                if (bHasCam || tarId == undefined) scene.add(mesh);
                else scene.children[tarId].add(mesh);
                var meshSX = mesh.clone();
                var meshPosSX = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanM, .5, 0);
                meshSX.position.x = meshPosSX.x;
                meshSX.position.y = meshPosSX.y;
                meshSX.position.z = meshPosSX.z;
                meshSX.lookAt(EachTarPos);
                this.camMeshs64.push(meshSX);
                var meshSY = mesh.clone();
                var meshPosSY = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanM, 0, -.5);
                meshSY.position.x = meshPosSY.x;
                meshSY.position.y = meshPosSY.y;
                meshSY.position.z = meshPosSY.z;
                meshSY.lookAt(EachTarPos);
                this.camMeshs64.push(meshSY);
                var meshSXY = mesh.clone();
                var meshPosSXY = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanM, .5, -.5);
                meshSXY.position.x = meshPosSXY.x;
                meshSXY.position.y = meshPosSXY.y;
                meshSXY.position.z = meshPosSXY.z;
                meshSXY.lookAt(EachTarPos);
                this.camMeshs64.push(meshSXY);
                if (bHasCam || tarId == undefined) {
                    scene.add(meshSX);
                    scene.add(meshSY);
                    scene.add(meshSXY)
                } else {
                    scene.children[tarId].add(meshSX);
                    scene.children[tarId].add(meshSY);
                    scene.children[tarId].add(meshSXY)
                } if (renderer.nShaderMode == 0 || renderer.nShaderMode == 4) {
                    meshSX.visible = false;
                    meshSY.visible = false;
                    meshSXY.visible = false
                }
                if (renderer.nShaderMode == 3) {
                    meshSX.visible =
                        false;
                    meshSY.visible = false
                }
            }
        this.ObjMesh2.push(renderer._holoCamCenter.eyeCenter);
        this.ObjMesh2.push(renderer._holoScreen.tarObj);
        this.camControls.attach(this.ObjMesh2[0], false);
        this.tarControls.attach(this.ObjMesh2[1], false);
        this.upPlaneControls.attach(renderer._holoScreen.auxBoxUpPlane, true);
        this.downPlaneControls.attach(renderer._holoScreen.auxBoxDownPlane, true);
        this.ObjMesh2[0].visible = true;
        this.ObjMesh2[1].visible = true;
        this.camPlaneTrackControls.Indicator.visible = false;
        if (bHasCam || tarId == undefined) {
            scene.add(this.ObjMesh2[0]);
            scene.add(this.ObjMesh2[1]);
            scene.add(this.camControls);
            scene.add(this.tarControls);
            this.tarControls.object.add(this.upPlaneControls);
            this.tarControls.object.add(this.downPlaneControls);
            scene.add(this.GcamTinyView);
            scene.add(this.camPlaneTrackControls.Indicator)
        } else {
            scene.children[tarId].add(this.ObjMesh2[0]);
            scene.children[tarId].add(this.ObjMesh2[1]);
            scene.children[tarId].add(this.tarControls);
            scene.children[tarId].add(this.camControls);
            this.tarControls.object.add(this.upPlaneControls);
            this.tarControls.object.add(this.downPlaneControls);
            scene.children[tarId].add(this.GcamTinyView);
            scene.children[tarId].add(this.camPlaneTrackControls.Indicator)
        }
    };
    this.init();
    this.update = function() {
        renderer._depCom.applyCompress(camera, scene);
        var spanMode = renderer._holoCamCenter.spanSphereMode;
        var _left = Math.floor(canvasWidth * this.GObserveView.left);
        var _bottom = Math.floor(canvasHeight * this.GObserveView.bottom);
        var _width = Math.floor(canvasWidth * this.GObserveView.width);
        var _height = Math.floor(canvasHeight * this.GObserveView.height);
        renderer.setViewport(_left,
            _bottom, _width, _height);
        renderer.setScissor(_left, _bottom, _width, _height);
        renderer.enableScissorTest(true);
        renderer.setClearColor((new THREE.Color).setRGB(.11, .12, .18));
        this.Gcamera.aspect = _width / _height;
        this.Gcamera.updateProjectionMatrix();
        var vecCend2 = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        var vecGT2 = new THREE.Vector3((camera.position.x + camera.targetPosition.x) / 2, (camera.position.y + camera.targetPosition.y) / 2, (camera.position.z + camera.targetPosition.z) / 2);
        var vecDir =
            new THREE.Vector3(vecCend2.x - vecGT2.x, vecCend2.y - vecGT2.y, vecCend2.z - vecGT2.z);
        var vecCam = new THREE.Vector3;
        vecCam.copy(vecDir).multiplyScalar(1.1).add(vecCend2);
        this.GcamTinyView.position.x = vecCam.x;
        this.GcamTinyView.position.y = vecCam.y;
        this.GcamTinyView.position.z = vecCam.z;
        this.GcamTinyView.lookAt(new THREE.Vector3(vecGT2.x, vecGT2.y, vecGT2.z));
        var disScale = renderer._holoClipFrustum.cur_dis / renderer._holoCamCenter.origin_dis;
        var curI = Math.round(this.selectedView.x);
        var curJ = Math.round(this.selectedView.y);
        var cur_leftI = (curI + 7) % npart;
        var cur_leftJ = curJ;
        var cur_rightI = (curI + 1) % npart;
        var cur_rightJ = curJ;
        var cur_upI = curI;
        var cur_upJ = (curJ + 1) % npart;
        var cur_downI = curI;
        var cur_downJ = (curJ + 7) % npart;
        var cur_luI = (curI + 7) % npart;
        var cur_luJ = (curJ + 1) % npart;
        var cur_ruI = (curI + 1) % npart;
        var cur_ruJ = (curJ + 1) % npart;
        var cur_rdI = (curI + 1) % npart;
        var cur_rdJ = (curJ + 7) % npart;
        var cur_ldI = (curI + 7) % npart;
        var cur_ldJ = (curJ + 7) % npart;
        for (var i = 0; i < npart; i++)
            for (var j = 0; j < npart; j++) {
                var Gradient = new THREE.Vector3;
                var EachTarPos =
                    new THREE.Vector3;
                if (renderer.nShaderMode == 0 || renderer.nShaderMode == 4) {
                    var meshPosition = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode);
                    this.camMeshs64[(i * npart + j) * 4 + 0].position.copy(new THREE.Vector3(meshPosition.x, meshPosition.y, meshPosition.z));
                    this.camMeshs64[(i * npart + j) * 4 + 0].scale.copy(new THREE.Vector3(disScale, disScale, disScale));
                    this.camMeshs64[(i * npart + j) * 4 + 0].lookAt(EachTarPos);
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.left =
                        0;
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.width = canvasWidth * this.GObserveView.width;
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.height = canvasHeight * this.GObserveView.height;
                    this.camMeshs64[(i * npart + j) * 4 + 0].update();
                    if (curI == i && curJ == j || cur_leftI == i && cur_leftJ == j || cur_rightI == i && cur_rightJ == j || cur_upI == i && cur_upJ == j || cur_downI == i && cur_downJ == j || cur_luI == i && cur_luJ == j || cur_ruI == i && cur_ruJ == j ||
                        cur_rdI == i && cur_rdJ == j || cur_ldI == i && cur_ldJ == j) this.camMeshs64[(i * npart + j) * 4 + 0].bSelected = true;
                    else this.camMeshs64[(i * npart + j) * 4 + 0].bSelected = false;
                    this.camMeshs64[(i * npart + j) * 4 + 1].visible = false;
                    this.camMeshs64[(i * npart + j) * 4 + 2].visible = false;
                    this.camMeshs64[(i * npart + j) * 4 + 3].visible = false
                } else if (renderer.nShaderMode == 1 || renderer.nShaderMode == 2) {
                    this.camMeshs64[(i * npart + j) * 4 + 1].visible = true;
                    this.camMeshs64[(i * npart + j) * 4 + 2].visible = true;
                    this.camMeshs64[(i * npart + j) * 4 + 3].visible = true;
                    var meshPosition =
                        renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode);
                    this.camMeshs64[(i * npart + j) * 4 + 0].position.copy(new THREE.Vector3(meshPosition.x, meshPosition.y, meshPosition.z));
                    this.camMeshs64[(i * npart + j) * 4 + 0].scale.copy(new THREE.Vector3(disScale, disScale, disScale));
                    this.camMeshs64[(i * npart + j) * 4 + 0].lookAt(EachTarPos);
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.left = 0;
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.top = canvasHeight * (1 - this.GObserveView.bottom -
                        this.GObserveView.height);
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.width = canvasWidth * this.GObserveView.width;
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.height = canvasHeight * this.GObserveView.height;
                    this.camMeshs64[(i * npart + j) * 4 + 0].update();
                    if (curI == i && curJ == j || cur_leftI == i && cur_leftJ == j || cur_rightI == i && cur_rightJ == j || cur_upI == i && cur_upJ == j || cur_downI == i && cur_downJ == j || cur_luI == i && cur_luJ == j || cur_ruI == i && cur_ruJ == j || cur_rdI == i && cur_rdJ == j || cur_ldI == i && cur_ldJ == j) this.camMeshs64[(i * npart + j) * 4 + 0].bSelected =
                        true;
                    else this.camMeshs64[(i * npart + j) * 4 + 0].bSelected = false;
                    var meshPosSX = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode, .5, 0);
                    this.camMeshs64[(i * npart + j) * 4 + 1].position.copy(new THREE.Vector3(meshPosSX.x, meshPosSX.y, meshPosSX.z));
                    this.camMeshs64[(i * npart + j) * 4 + 1].scale.copy(new THREE.Vector3(disScale, disScale, disScale));
                    this.camMeshs64[(i * npart + j) * 4 + 1].lookAt(EachTarPos);
                    var meshPosSY = renderer.getCameraPositionByFile(camera.position,
                        camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode, 0, -.5);
                    this.camMeshs64[(i * npart + j) * 4 + 2].position.copy(new THREE.Vector3(meshPosSY.x, meshPosSY.y, meshPosSY.z));
                    this.camMeshs64[(i * npart + j) * 4 + 2].scale.copy(new THREE.Vector3(disScale, disScale, disScale));
                    this.camMeshs64[(i * npart + j) * 4 + 2].lookAt(EachTarPos);
                    var meshPosSXY = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode, .5, -.5);
                    this.camMeshs64[(i * npart + j) * 4 + 3].position.copy(new THREE.Vector3(meshPosSXY.x,
                        meshPosSXY.y, meshPosSXY.z));
                    this.camMeshs64[(i * npart + j) * 4 + 3].scale.copy(new THREE.Vector3(disScale, disScale, disScale));
                    this.camMeshs64[(i * npart + j) * 4 + 3].lookAt(EachTarPos)
                } else {
                    this.camMeshs64[(i * npart + j) * 4 + 1].visible = false;
                    this.camMeshs64[(i * npart + j) * 4 + 2].visible = false;
                    this.camMeshs64[(i * npart + j) * 4 + 3].visible = true;
                    var meshPosition = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode);
                    this.camMeshs64[(i * npart + j) * 4 + 0].position.copy(new THREE.Vector3(meshPosition.x,
                        meshPosition.y, meshPosition.z));
                    this.camMeshs64[(i * npart + j) * 4 + 0].scale.copy(new THREE.Vector3(disScale, disScale, disScale));
                    this.camMeshs64[(i * npart + j) * 4 + 0].lookAt(EachTarPos);
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.left = 0;
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.width = canvasWidth * this.GObserveView.width;
                    this.camMeshs64[(i * npart + j) * 4 + 0].screen.height = canvasHeight * this.GObserveView.height;
                    this.camMeshs64[(i *
                        npart + j) * 4 + 0].update();
                    if (curI == i && curJ == j || cur_leftI == i && cur_leftJ == j || cur_rightI == i && cur_rightJ == j || cur_upI == i && cur_upJ == j || cur_downI == i && cur_downJ == j || cur_luI == i && cur_luJ == j || cur_ruI == i && cur_ruJ == j || cur_rdI == i && cur_rdJ == j || cur_ldI == i && cur_ldJ == j) this.camMeshs64[(i * npart + j) * 4 + 0].bSelected = true;
                    else this.camMeshs64[(i * npart + j) * 4 + 0].bSelected = false;
                    var meshPosSXY = renderer.getCameraPositionByFile(camera.position, camera.targetPosition, camera.up, npart, i, j, Gradient, EachTarPos, spanMode, .5, -.5);
                    this.camMeshs64[(i *
                        npart + j) * 4 + 3].position.copy(new THREE.Vector3(meshPosSXY.x, meshPosSXY.y, meshPosSXY.z));
                    this.camMeshs64[(i * npart + j) * 4 + 3].scale.copy(new THREE.Vector3(disScale, disScale, disScale));
                    this.camMeshs64[(i * npart + j) * 4 + 3].lookAt(EachTarPos)
                }
            }
        this.LocalControls.enabled = true;
        if (this.tarControls.axis != null || this.camControls.axis != null || this.upPlaneControls.axis != null || this.downPlaneControls.axis != null) this.LocalControls.enabled = false;
        this.LocalControls.screen.left = 0;
        this.LocalControls.screen.top = canvasHeight * (1 -
            this.GObserveView.bottom - this.GObserveView.height);
        this.LocalControls.screen.width = canvasWidth * this.GObserveView.width;
        this.LocalControls.screen.height = canvasHeight * this.GObserveView.height;
        this.LocalControls.update();
        this.camControls.screen.left = 0;
        this.camControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.camControls.screen.width = canvasWidth * this.GObserveView.width;
        this.camControls.screen.height = canvasHeight * this.GObserveView.height;
        this.camControls.update();
        renderer._holoCamCenter.fov = this.camControls.view64fov;
        renderer._holoCamCenter.spanSphereMode = this.camControls.spanSphereMode;
        this.tarControls.screen.left = 0;
        this.tarControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.tarControls.screen.width = canvasWidth * this.GObserveView.width;
        this.tarControls.screen.height = canvasHeight * this.GObserveView.height;
        this.tarControls.update();
        camera.position.copy(this.camControls.object.position);
        camera.targetPosition.copy(this.tarControls.object.position);
        camera.lookAt(camera.targetPosition);
        this.upPlaneControls.screen.left = 0;
        this.upPlaneControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.upPlaneControls.screen.width = canvasWidth * this.GObserveView.width;
        this.upPlaneControls.screen.height = canvasHeight * this.GObserveView.height;
        this.upPlaneControls.update();
        this.downPlaneControls.screen.left = 0;
        this.downPlaneControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.downPlaneControls.screen.width =
            canvasWidth * this.GObserveView.width;
        this.downPlaneControls.screen.height = canvasHeight * this.GObserveView.height;
        this.downPlaneControls.update();
        this.camPlaneTrackControls.screen.left = canvasWidth * this.GObserveView.left;
        this.camPlaneTrackControls.screen.top = canvasHeight * (1 - this.GObserveView.bottom - this.GObserveView.height);
        this.camPlaneTrackControls.screen.width = canvasWidth * this.GObserveView.width;
        this.camPlaneTrackControls.screen.height = canvasHeight * this.GObserveView.height;
        this.camPlaneTrackControls.update();
        this.selectedView.x = this.camPlaneTrackControls.touchPos.x * 7;
        this.selectedView.y = this.camPlaneTrackControls.touchPos.y * 7;
        if (renderer.bGlobalView)
            if (renderer.curMode != 1) {
                this.camPlaneTrackControls.enable = false;
                renderer.render(scene, this.Gcamera, renderTarget, forceClear)
            } else {
                this.camPlaneTrackControls.enable = true;
                renderer.render(scene, this.GcamTinyView, renderTarget, forceClear)
            }
    };
    var lastBgView, lastBgyro;
    if (renderer.bHidePanels) {
        lastBgView = renderer.bGlobalView;
        lastBgyro = renderer.bGyroSimView
    }
    var _this =
        this;
    this.setVisibleOn = function() {
        _this.tarControls.axisPickers[0].traverse(function(child) {
            child.visible = true;
            if (child.parent == _this.tarControls.axisPickers[0].pickers) child.visible = false;
            if (child.parent == _this.tarControls.axisPickers[0].planes) child.visible = false;
            if (child.parent == _this.tarControls.axisPickers[0].handles) child.visible = true
        });
        _this.tarControls.object.visible = true;
        _this.camControls.axisPickers[0].traverse(function(child) {
            child.visible = true;
            if (child.parent == _this.camControls.axisPickers[0].pickers) child.visible =
                false;
            if (child.parent == _this.camControls.axisPickers[0].planes) child.visible = false;
            if (child.parent == _this.camControls.axisPickers[0].handles) child.visible = true
        });
        _this.camControls.object.visible = true;
        _this.upPlaneControls.axisPickers[0].traverse(function(child) {
            child.visible = true;
            if (child.parent == _this.upPlaneControls.axisPickers[0].pickers) child.visible = false;
            if (child.parent == _this.upPlaneControls.axisPickers[0].planes) child.visible = false;
            if (child.parent == _this.upPlaneControls.axisPickers[0].handles) child.visible =
                true
        });
        _this.upPlaneControls.object.visible = true;
        _this.downPlaneControls.axisPickers[0].traverse(function(child) {
            child.visible = true;
            if (child.parent == _this.downPlaneControls.axisPickers[0].pickers) child.visible = false;
            if (child.parent == _this.downPlaneControls.axisPickers[0].planes) child.visible = false;
            if (child.parent == _this.downPlaneControls.axisPickers[0].handles) child.visible = true
        });
        _this.downPlaneControls.object.visible = true
    };
    this.setVisibleOff = function() {
        _this.tarControls.axisPickers[0].traverse(function(child) {
            child.visible =
                false;
            if (child.parent == _this.tarControls.axisPickers[0].pickers) child.visible = false;
            if (child.parent == _this.tarControls.axisPickers[0].planes) child.visible = false;
            if (child.parent == _this.tarControls.axisPickers[0].handles) child.visible = false
        });
        _this.tarControls.object.visible = false;
        _this.camControls.axisPickers[0].traverse(function(child) {
            child.visible = false;
            if (child.parent == _this.camControls.axisPickers[0].pickers) child.visible = false;
            if (child.parent == _this.camControls.axisPickers[0].planes) child.visible =
                false;
            if (child.parent == _this.camControls.axisPickers[0].handles) child.visible = false
        });
        _this.camControls.object.visible = false;
        _this.upPlaneControls.axisPickers[0].traverse(function(child) {
            child.visible = false;
            if (child.parent == _this.upPlaneControls.axisPickers[0].pickers) child.visible = false;
            if (child.parent == _this.upPlaneControls.axisPickers[0].planes) child.visible = false;
            if (child.parent == _this.upPlaneControls.axisPickers[0].handles) child.visible = false
        });
        _this.upPlaneControls.object.visible = false;
        _this.downPlaneControls.axisPickers[0].traverse(function(child) {
            child.visible =
                false;
            if (child.parent == _this.downPlaneControls.axisPickers[0].pickers) child.visible = false;
            if (child.parent == _this.downPlaneControls.axisPickers[0].planes) child.visible = false;
            if (child.parent == _this.downPlaneControls.axisPickers[0].handles) child.visible = false
        });
        _this.downPlaneControls.object.visible = false
    };
    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        switch (keyCode) {
            case 84:
                renderer.setrendermodetoSingleView();
                _this.setVisibleOff();
                break;
            case 85:
                renderer.setrendermodetoTiledView();
                _this.setVisibleOff();
                break;
            case 86:
                renderer.setrendermodetoSwizzleMode();
                _this.setVisibleOff();
                break;
            case 87:
                renderer.setrendermodetoTuningPanelOn();
                _this.setVisibleOn();
                break;
            case 88:
                renderer.setrendermodetoGyroPanelOn();
                _this.setVisibleOn();
                break;
            case 90:
                renderer.setrendermodetoSimulatorView();
                _this.setVisibleOff();
                break
        }
    }
    addEventListener("message", function(event) {
        var msg = JSON.parse(event.data);
        switch (msg.type) {
            case "outputType":
                setRenderType(msg.data.type);
                break;
            default:
        }
    }, false);

    function setRenderType(renderType) {
        console.log("set render Type:" + renderType);
        switch (renderType) {
            case "singleView":
                renderer.setrendermodetoSingleView();
                _this.setVisibleOff();
                break;
            case "64Views":
                renderer.setrendermodetoTiledView();
                _this.setVisibleOff();
                break;
            case "Swizzle":
                renderer.setrendermodetoSwizzleMode();
                _this.setVisibleOff();
                break;
            case "TuningPanel":
                renderer.setrendermodetoTuningPanelOn();
                _this.setVisibleOn();
                break;
            case "GyroPanel":
                renderer.setrendermodetoGyroPanelOn();
                _this.setVisibleOn();
                break;
            case "SimulatorView":
                renderer.setrendermodetoSimulatorView();
                _this.setVisibleOff();
                break;
                console.log("set rendermode SimulatorView");
            default:
                renderer.setrendermodetoTuningPanelOn();
                _this.setVisibleOn();
                break
        }
    }
};
var LeiaWebGLRenderer = function(parameters) {
    console.log("LeiaWebGLRenderer", LEIA.REVISION);
    var message = JSON.stringify({
        type: "version",
        data: {
            version: LEIA.REVISION
        }
    });
    window.top.postMessage(message, "*");
    parameters = parameters || {};
    THREE.WebGLRenderer.call(this, parameters);
    this.curMode = undefined;
    this.setrendermodetoSingleView = function() {
        this._renderMode = 0;
        this.bGlobalView = false;
        this.bGyroSimView = false;
        this.bTinyMode = false;
        this.curMode = 3
    };
    this.setrendermodetoTiledView = function() {
        this._renderMode = 1;
        this.bGlobalView =
            false;
        this.bGyroSimView = false;
        this.bTinyMode = false;
        this.curMode = 4
    };
    this.setrendermodetoSwizzleMode = function() {
        this._renderMode = 2;
        this.nShaderMode = 3;
        this.bGlobalView = false;
        this.bGyroSimView = false;
        this.bTinyMode = false;
        this.curMode = 2
    };
    this.setrendermodetoTuningPanelOn = function() {
        this._renderMode = 0;
        this.nShaderMode = 0;
        this.bGlobalView = true;
        this.bGyroSimView = false;
        this.bTinyMode = false;
        this.curMode = 0
    };
    this.setrendermodetoGyroPanelOn = function() {
        this._renderMode = 0;
        this.nShaderMode = 0;
        this.bGlobalView = true;
        this.bGyroSimView = true;
        this.bTinyMode = false;
        this.curMode = 5
    };
    this.setrendermodetoSimulatorView = function() {
        this._renderMode = 2;
        this.nShaderMode = 4;
        this.bGlobalView = true;
        this.bGyroSimView = false;
        this.bTinyMode = true;
        this.curMode = 1
    };
    if (parameters.renderMode == undefined) {
        this._renderMode = 0;
        console.log("renderMode undefined!")
    } else {
        switch (parameters.renderMode) {
            case "SingleView":
            case "0":
                this.setrendermodetoSingleView();
                break;
            case "TiledView":
            case "1":
                this.setrendermodetoTiledView();
                break;
            case "SwizzleMode":
            case "2":
                this.setrendermodetoSwizzleMode();
                break;
            case "TuningPanelOn":
            case "3":
                this.setrendermodetoTuningPanelOn();
                break;
            case "GyroPanelOn":
            case "4":
                this.setrendermodetoGyroPanelOn();
                break;
            case "SimulatorView":
            case "5":
                this.setrendermodetoSimulatorView();
                break;
            default:
                this.setrendermodetoTuningPanelOn();
                break
        }
        console.log("setRenderMode:" + parameters.renderMode)
    } if (parameters.shaderMode == undefined) {
        this.nShaderMode = 0;
        console.log("nShaderMode undefined!")
    } else {
        switch (parameters.shaderMode) {}
        console.log("setShaderMode:" + this.nShaderMode)
    } if (parameters.colorMode ==
        undefined) {
        this.colorMode = false;
        console.log("colorMode undefined, defualt mono!")
    } else if (parameters.colorMode == "color") {
        this.colorMode = true;
        console.log("colorMode: color")
    } else {
        this.colorMode = false;
        console.log("colorMode: mono")
    } if (parameters.compFac == undefined) this.compFac = 1;
    else this.compFac = parameters.compFac;
    var _canvas = parameters.canvas !== undefined ? parameters.canvas : document.createElement("canvas"),
        _viewportWidth, _viewportHeight;
    var _that = this;
    LEIA.time0 = Date.now() * .001;
    LEIA.time1 = LEIA.time0;
    LEIA.time = 0;
    this.setRenderMode = function(renderMode) {
        this._renderMode = renderMode
    };
    this.GTinyView = {
        left: 0,
        bottom: .2,
        width: .125,
        height: .125,
        up: [0, 1, 0]
    };
    this.Leia_setSize = function(parameters) {
        parameters = parameters || {};
        var width = parameters.width;
        var height = parameters.height;
        var autoFit = parameters.autoFit;
        var updateStyle = parameters.updateStyle;
        if (autoFit === true) {
            if (LEIA.DeviceResolutionWidth === 200 && LEIA.DeviceResolutionHeight === 150)
                if (width * 3 <= height * 4) {
                    width = Math.max(width - width % 32, 32);
                    height = 3 * width /
                        4
                } else {
                    height = Math.max(height - height % 24, 24);
                    width = height * 4 / 3
                } else if (LEIA.DeviceResolutionWidth === 200 && LEIA.DeviceResolutionHeight === 200)
                if (width * 1 <= height * 1) {
                    width = Math.max(width - width % 8, 8);
                    height = width
                } else {
                    height = Math.max(height - height % 8, 8);
                    width = height
                } else console.log("unepxected device resolution:" + LEIA.DeviceResolutionWidth + "*" + LEIA.DeviceResolutionHeight);
            console.log("autoFit size: " + width + "*" + height)
        }
        _canvas.width = width * this.devicePixelRatio;
        _canvas.height = height * this.devicePixelRatio;
        _viewportWidth =
            _canvas.width, _viewportHeight = _canvas.height;
        if (updateStyle !== false) {
            _canvas.style.width = width + "px";
            _canvas.style.height = height + "px"
        }
        this.setSize(width, height, updateStyle);
        if (this._shaderManager !== undefined) this._shaderManager.changeSzie(width, height)
    };
    this._shaderManager = undefined;
    this.bShaderManInit = false;
    this.getCameraPositionByFile = function(position, targetPosition, up, npart, xIndex, yIndex, Gradient, EachTarPos, spanMode, shiftX, shiftY) {
        var scale;
        if (npart !== 1) scale = LEIA.fov / (npart - 1);
        else scale = 0;
        var mat20,
            mat21, mat22;
        var v0, v1, v2;
        v0 = mat20 = position.x - targetPosition.x;
        v1 = mat21 = position.y - targetPosition.y;
        v2 = mat22 = position.z - targetPosition.z;
        var len = Math.sqrt(mat20 * mat20 + mat21 * mat21 + mat22 * mat22);
        mat20 /= len;
        mat21 /= len;
        mat22 /= len;
        var mat00, mat01, mat02;
        mat00 = mat22;
        mat01 = 0;
        mat02 = -mat20;
        if (v1 > 0 && v1 >= Math.abs(v0) * 2 && v1 >= Math.abs(v2) * 2) {
            mat00 = mat21;
            mat01 = -mat20;
            mat02 = 0
        }
        len = Math.sqrt(mat00 * mat00 + mat01 * mat01 + mat02 * mat02);
        mat00 /= len;
        mat01 /= len;
        mat02 /= len;
        var mat10, mat11, mat12;
        mat10 = mat21 * mat02;
        mat11 = mat22 * mat00 -
            mat20 * mat02;
        mat12 = -mat21 * mat00;
        len = Math.sqrt(mat10 * mat10 + mat11 * mat11 + mat12 * mat12);
        mat10 /= len;
        mat11 /= len;
        mat12 /= len;
        len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
        var halfRange = Math.tan(THREE.Math.degToRad(3.5 * scale)) * len;
        var baseLine = halfRange / 3.5;
        if (shiftX == undefined) shiftX = 0;
        if (shiftY == undefined) shiftY = 0;
        var arrayIndex = (npart - 1 - yIndex) * npart + xIndex;
        var curDirect = new THREE.Vector3(LEIA.view_angles[arrayIndex][0], LEIA.view_angles[arrayIndex][1], LEIA.view_angles[arrayIndex][2]);
        var curXAng = THREE.Math.radToDeg(Math.atan(curDirect.y /
            curDirect.z));
        var curYAng = THREE.Math.radToDeg(Math.atan(curDirect.x / curDirect.z));
        if (baseLine == 0) {
            curXAng = 0;
            curYAng = 0
        }
        len = v0 * v0 + v1 * v1 + v2 * v2;
        var phi = curYAng;
        var alpha = curXAng;
        var u0, u1, u2;
        var theta = 90 - Math.atan(Math.tan(THREE.Math.degToRad(alpha)) * Math.cos(THREE.Math.degToRad(phi))) * 180 / Math.PI;
        u0 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta)) * Math.sin(THREE.Math.degToRad(phi));
        u1 = Math.sqrt(len) * Math.cos(THREE.Math.degToRad(theta));
        u2 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta)) * Math.cos(THREE.Math.degToRad(phi));
        if (!spanMode) {
            u0 = Math.sqrt(len) * Math.tan(THREE.Math.degToRad(phi)) + shiftX * baseLine;
            u1 = Math.sqrt(len) / (Math.tan(THREE.Math.degToRad(theta)) * Math.cos(THREE.Math.degToRad(phi))) + shiftY * baseLine;
            u2 = Math.sqrt(len)
        }
        var s0, s1, s2;
        s0 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta) - 1) * Math.sin(THREE.Math.degToRad(phi));
        s1 = Math.sqrt(len) * Math.cos(THREE.Math.degToRad(theta) - 1);
        s2 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta) - 1) * Math.cos(THREE.Math.degToRad(phi));
        var t0, t1, t2;
        t0 = mat00 * s0 + mat10 * s1 + mat20 *
            s2 + targetPosition.x;
        t1 = mat11 * s1 + mat21 * s2 + targetPosition.y;
        t2 = mat02 * s0 + mat12 * s1 + mat22 * s2 + targetPosition.z;
        Gradient.x = t0;
        Gradient.y = t1;
        Gradient.z = t2;
        var w0, w1, w2;
        w0 = mat00 * u0 + mat10 * u1 + mat20 * u2 + targetPosition.x;
        w1 = mat01 * u0 + mat11 * u1 + mat21 * u2 + targetPosition.y;
        w2 = mat02 * u0 + mat12 * u1 + mat22 * u2 + targetPosition.z;
        var outPosition = new THREE.Vector3;
        outPosition.x = w0;
        outPosition.y = w1;
        outPosition.z = w2;
        var _eachTarPos = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
        _eachTarPos.add(outPosition.clone().sub(position));
        EachTarPos.copy(_eachTarPos);
        return outPosition
    };
    this.getCameraPositionAuto = function(position, targetPosition, up, npart, xIndex, yIndex, Gradient, EachTarPos, spanMode, shiftX, shiftY) {
        if (position.x == 0 && position.y != 0 && position.z == 0) position.z = position.y / 100;
        var scale;
        if (npart !== 1) scale = _that._holoCamCenter.fov / (npart - 1);
        else scale = 0;
        var mat20, mat21, mat22;
        var v0, v1, v2;
        v0 = mat20 = position.x - targetPosition.x;
        v1 = mat21 = position.y - targetPosition.y;
        v2 = mat22 = position.z - targetPosition.z;
        var len = Math.sqrt(mat20 * mat20 +
            mat21 * mat21 + mat22 * mat22);
        mat20 /= len;
        mat21 /= len;
        mat22 /= len;
        var mat00, mat01, mat02;
        mat00 = mat22;
        mat01 = 0;
        mat02 = -mat20;
        if (v1 > 0 && v1 >= Math.abs(v0) * 2 && v1 >= Math.abs(v2) * 2) {
            mat00 = mat21;
            mat01 = -mat20;
            mat02 = 0
        }
        len = Math.sqrt(mat00 * mat00 + mat02 * mat02);
        mat00 /= len;
        mat01 /= len;
        mat02 /= len;
        var mat10, mat11, mat12;
        mat10 = mat21 * mat02;
        mat11 = mat22 * mat00 - mat20 * mat02;
        mat12 = -mat21 * mat00;
        len = Math.sqrt(mat10 * mat10 + mat11 * mat11 + mat12 * mat12);
        mat10 /= len;
        mat11 /= len;
        mat12 /= len;
        len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
        var halfRange = Math.tan(THREE.Math.degToRad(3.5 *
            scale)) * len;
        var baseLine = halfRange / 3.5;
        if (shiftX == undefined) shiftX = 0;
        if (shiftY == undefined) shiftY = 0;
        var curX = xIndex - 3.5 + shiftX;
        var curY = yIndex - 3.5 + shiftY;
        var curXRange = curY * baseLine;
        var curYRange = curX * baseLine;
        var curXAng = THREE.Math.radToDeg(Math.atan(curXRange / len));
        var curYAng = THREE.Math.radToDeg(Math.atan(curYRange / len));
        var nxyx = (new THREE.Vector3(curYRange, curXRange, len)).normalize();
        len = v0 * v0 + v1 * v1 + v2 * v2;
        var phi = curYAng;
        var alpha = curXAng;
        var u0, u1, u2;
        var theta = 90 - Math.atan(Math.tan(THREE.Math.degToRad(alpha)) *
            Math.cos(THREE.Math.degToRad(phi))) * 180 / Math.PI;
        u0 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta)) * Math.sin(THREE.Math.degToRad(phi));
        u1 = Math.sqrt(len) * Math.cos(THREE.Math.degToRad(theta));
        u2 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta)) * Math.cos(THREE.Math.degToRad(phi));
        if (!spanMode) {
            u0 = curYRange;
            u1 = curXRange;
            u2 = Math.sqrt(len)
        }
        var s0, s1, s2;
        s0 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta) - 1) * Math.sin(THREE.Math.degToRad(phi));
        s1 = Math.sqrt(len) * Math.cos(THREE.Math.degToRad(theta) - 1);
        s2 = Math.sqrt(len) * Math.sin(THREE.Math.degToRad(theta) - 1) * Math.cos(THREE.Math.degToRad(phi));
        var t0, t1, t2;
        t0 = mat00 * s0 + mat10 * s1 + mat20 * s2 + targetPosition.x;
        t1 = mat11 * s1 + mat21 * s2 + targetPosition.y;
        t2 = mat02 * s0 + mat12 * s1 + mat22 * s2 + targetPosition.z;
        Gradient.x = t0;
        Gradient.y = t1;
        Gradient.z = t2;
        var w0, w1, w2;
        w0 = mat00 * u0 + mat10 * u1 + mat20 * u2 + targetPosition.x;
        w1 = mat01 * u0 + mat11 * u1 + mat21 * u2 + targetPosition.y;
        w2 = mat02 * u0 + mat12 * u1 + mat22 * u2 + targetPosition.z;
        var outPosition = new THREE.Vector3;
        outPosition.x = w0;
        outPosition.y = w1;
        outPosition.z = w2;
        var _eachTarPos = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
        _eachTarPos.add(outPosition.clone().sub(position));
        EachTarPos.copy(_eachTarPos);
        return outPosition
    };
    this.getCameraIntrinsic = function(camera, _tarObj, _i, _j) {
        var _local_lrbt = [];
        for (var i = 0; i < 4; i++) {
            var point = new THREE.Vector3;
            _local_lrbt.push(point)
        }
        var camMat = new THREE.Matrix4;
        camMat.getInverse(camera.matrix);
        camMat.multiply(_tarObj.matrix);
        for (var i = 0; i < 4; i++) {
            var __point = new THREE.Vector3(_tarObj.geometry.vertices[i].x,
                _tarObj.geometry.vertices[i].y, _tarObj.geometry.vertices[i].z);
            _local_lrbt[i].copy(__point)
        }
        for (var i = 0; i < 4; i++) _local_lrbt[i].applyMatrix4(camMat);
        var n = camera.near;
        var f = camera.far;
        var d = 0;
        if (_local_lrbt[0] !== undefined) {
            var r = _local_lrbt[3].x;
            var l = _local_lrbt[2].x;
            var t = _local_lrbt[1].y;
            var b = _local_lrbt[3].y;
            d = -1 * _local_lrbt[3].z;
            var m11 = 2 * d / (r - l);
            var m12 = 0;
            var m13 = (r + l) / (r - l);
            var m14 = 0;
            var m21 = 0;
            var m22 = 2 * d / (t - b);
            var m23 = (t + b) / (t - b);
            var m24 = 0;
            var m31 = 0;
            var m32 = 0;
            var m33 = (f + n) / (n - f);
            var m34 = 2 *
                f * n / (n - f);
            var m41 = 0;
            var m42 = 0;
            var m43 = -1;
            var m44 = 0;
            camera.projectionMatrix.set(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44)
        }
        return d
    };
    this._holoScreen = undefined;
    this.bHoloScreenInit = false;
    var CHoloScreen = function(camera, _sizeX, _up, _down) {
        this.position = new THREE.Vector3(0, 0, 0);
        this.position.copy(camera.targetPosition);
        this.scale = 1;
        var originSize = _sizeX;
        this.sizeX = _sizeX;
        var _length = this.sizeX / 200;
        var geoTarRect = new THREE.PlaneGeometry(1 * _length * 200, 1 * _length * 150, 1, 1);
        var matTarRect =
            new THREE.MeshBasicMaterial({
                color: 26282,
                transparent: true,
                opacity: .2
            });
        matTarRect.side = THREE.DoubleSide;
        this.tarObj = new THREE.Mesh(geoTarRect, matTarRect);
        this.tarObj.name = "tarPlane";
        this.tarObj.leiaType = 1;
        this.tarObj.visible = true;
        this.tarObj.rotation.setFromRotationMatrix(camera.matrix);
        this.tarObj.position.set(this.position.x, this.position.y, this.position.z);
        this.tarObj.scale.x = this.scale;
        this.tarObj.scale.y = this.scale;
        this.tarObj.scale.z = this.scale;
        this.tarObj.updateMatrix();
        var dofZ = 1 * _length *
            (1 / LEIA.DeltaTheta);
        var halfX = 1 * _length * 100;
        var halfY = 1 * _length * 75;
        var halfZ = 1 * dofZ * LEIA.Disparity * .75;
        var vtx = [];
        this.auxBoxUpPlane = new THREE.Object3D;
        vtx.push(new THREE.Vector3(halfX, halfY, 0));
        vtx.push(new THREE.Vector3(halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX, halfY, 0));
        this.auxBoxDownPlane = new THREE.Object3D;
        vtx.push(new THREE.Vector3(halfX, halfY, 0));
        vtx.push(new THREE.Vector3(halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX,
            halfY, 0));
        var matLine = new THREE.LineBasicMaterial({
            color: 39219
        });
        var linePZ = [];
        for (var ii = 0; ii < 4; ii++) {
            var linegeo = new THREE.Geometry;
            linegeo.vertices.push(vtx[ii], vtx[(ii + 1) % 4]);
            linePZ.push(new THREE.Line(linegeo, matLine, THREE.LinePieces));
            this.auxBoxUpPlane.add(linePZ[ii])
        }
        this.auxBoxUpPlane.name = "UpPlane";
        var __point = new THREE.Vector3;
        __point.copy(camera.position.clone().sub(camera.targetPosition));
        var origin_dis = __point.length();
        if (_up == undefined) this.auxBoxUpPlane.position.z = halfZ;
        else this.auxBoxUpPlane.position.z =
            _up;
        this.tarObj.add(this.auxBoxUpPlane);
        var lineNZ = [];
        for (var jj = 0; jj < 4; jj++) {
            var linegeo = new THREE.Geometry;
            linegeo.vertices.push(vtx[jj + 4], vtx[(jj + 1) % 4 + 4]);
            lineNZ.push(new THREE.Line(linegeo, matLine));
            this.auxBoxDownPlane.add(lineNZ[jj])
        }
        this.auxBoxDownPlane.name = "DownPlane";
        if (_down == undefined) this.auxBoxDownPlane.position.z = -halfZ;
        else this.auxBoxDownPlane.position.z = _down;
        this.tarObj.add(this.auxBoxDownPlane);
        var vtxDot = [];
        this.auxDoFUpPlane = new THREE.Object3D;
        vtxDot.push(new THREE.Vector3(halfX,
            halfY, 0));
        vtxDot.push(new THREE.Vector3(halfX, -halfY, 0));
        vtxDot.push(new THREE.Vector3(-halfX, -halfY, 0));
        vtxDot.push(new THREE.Vector3(-halfX, halfY, 0));
        this.auxDoFDownPlane = new THREE.Object3D;
        vtxDot.push(new THREE.Vector3(halfX, halfY, 0));
        vtxDot.push(new THREE.Vector3(halfX, -halfY, 0));
        vtxDot.push(new THREE.Vector3(-halfX, -halfY, 0));
        vtxDot.push(new THREE.Vector3(-halfX, halfY, 0));
        var matDotLine = new THREE.LineDashedMaterial({
            color: 39219,
            dashSize: .05,
            gapSize: .05
        });
        var lineDotPZ = [];
        for (var iii = 0; iii < 4; iii++) {
            var linegeo =
                new THREE.Geometry;
            linegeo.vertices.push(vtxDot[iii], vtxDot[(iii + 1) % 4]);
            linegeo.computeLineDistances();
            lineDotPZ.push(new THREE.Line(linegeo, matDotLine));
            this.auxDoFUpPlane.add(lineDotPZ[iii])
        }
        this.auxDoFUpPlane.name = "UpDoFPlane";
        this.auxDoFUpPlane.position.z = dofZ;
        this.tarObj.add(this.auxDoFUpPlane);
        var lineDotNZ = [];
        for (var jjj = 0; jjj < 4; jjj++) {
            var linegeo = new THREE.Geometry;
            linegeo.vertices.push(vtxDot[jjj + 4], vtxDot[(jjj + 1) % 4 + 4]);
            linegeo.computeLineDistances();
            lineDotNZ.push(new THREE.Line(linegeo,
                matDotLine));
            this.auxDoFDownPlane.add(lineDotNZ[jjj])
        }
        this.auxDoFDownPlane.name = "DownDoFPlane";
        this.auxDoFDownPlane.position.z = -dofZ;
        this.tarObj.add(this.auxDoFDownPlane);
        this.auxBoxEdges = new THREE.Object3D;
        var lineZZ = [];
        for (var kk = 0; kk < 4; kk++) {
            var linegeo = new THREE.Geometry;
            linegeo.vertices.push(this.auxBoxUpPlane.children[kk].geometry.vertices[0], this.auxBoxDownPlane.children[kk].geometry.vertices[0]);
            lineZZ.push(new THREE.Line(linegeo, matLine));
            this.auxBoxEdges.add(lineZZ[kk])
        }
        this.tarObj.add(this.auxBoxEdges);
        this._up = _up;
        this._down = _down;
        this.getData = function() {
            this.position.copy(this.tarObj.position);
            this.scale = this.tarObj.scale.x;
            this.sizeX = originSize * this.scale;
            this.tarObj.rotation.setFromRotationMatrix(camera.matrix);
            this._up = this.auxBoxUpPlane.position.z * this.scale;
            this._down = this.auxBoxDownPlane.position.z * this.scale;
            for (var ll = 0; ll < 4; ll++) {
                this.auxBoxEdges.children[ll].geometry.verticesNeedUpdate = true;
                var oldPsoition1 = new THREE.Vector3;
                oldPsoition1.copy(this.auxBoxDownPlane.children[ll].geometry.vertices[0]);
                var matW = new THREE.Matrix4;
                matW = this.auxBoxDownPlane.matrix;
                oldPsoition1.applyMatrix4(matW);
                this.auxBoxEdges.children[ll].geometry.vertices[1] = oldPsoition1;
                var oldPsoition2 = new THREE.Vector3;
                oldPsoition2.copy(this.auxBoxUpPlane.children[ll].geometry.vertices[0]);
                matW = this.auxBoxUpPlane.matrix;
                oldPsoition2.applyMatrix4(matW);
                this.auxBoxEdges.children[ll].geometry.vertices[0] = oldPsoition2
            }
        };
        this.setData = function() {
            this.tarObj.position.copy(this.position);
            this.tarObj.scale.x = this.scale;
            this.tarObj.scale.y =
                this.scale;
            this.tarObj.scale.z = this.scale;
            this.sizeX = originSize * this.scale;
            this.tarObj.rotation.setFromRotationMatrix(camera.matrix);
            this.auxBoxUpPlane.position.z = this._up;
            this.auxBoxDownPlane.position.z = this._down
        }
    };
    this._holoCamCenter = undefined;
    this.bHoloCamCenterInit = false;
    var CHoloCamCenter = function(camera, _fov) {
        this.position = new THREE.Vector3;
        this.position.copy(camera.position);
        this.fov = _fov;
        this.spanSphereMode = false;
        var __point = new THREE.Vector3;
        __point.copy(camera.position.clone().sub(camera.targetPosition));
        this.origin_dis = __point.length();
        var EyeCenterSize = this.origin_dis / 1E3;
        var geoEyeCenter = new THREE.SphereGeometry(EyeCenterSize, 32, 32);
        var matEyeCenter = new THREE.MeshBasicMaterial({
            color: 16711935,
            transparent: false
        });
        this.eyeCenter = new THREE.Mesh(geoEyeCenter, matEyeCenter);
        this.eyeCenter.position.set(this.position.x, this.position.y, this.position.z);
        this.eyeCenter.rotation.setFromRotationMatrix(camera.matrix);
        this.eyeCenter.name = "eyeCenter";
        this.eyeCenter.leiaType = 1;
        this.eyeCenter.visible = true;
        this.eyeCenter.updateMatrix();
        var camPlaneOriSzie = Math.tan(THREE.Math.degToRad(this.fov / 2)) * this.origin_dis * 2;
        var geoCamPlane = new THREE.PlaneGeometry(1 * camPlaneOriSzie, 1 * camPlaneOriSzie, 1, 1);
        var matCamPlane = new THREE.MeshBasicMaterial({
            color: 26282,
            transparent: true,
            opacity: .2
        });
        matCamPlane.side = THREE.DoubleSide;
        this.camPlane = new THREE.Mesh(geoCamPlane, matCamPlane);
        this.camPlane.visible = false;
        this.camPlane.name = "eyePlane";
        this.camPlane.leiaType = 1;
        this.eyeCenter.add(this.camPlane);
        this.getData = function() {
            this.position.copy(this.eyeCenter.position);
            this.eyeCenter.rotation.setFromRotationMatrix(camera.matrix);
            var curDis = new THREE.Vector3;
            curDis.copy(this.eyeCenter.position.clone().sub(camera.targetPosition));
            var cur_dis = curDis.length();
            var scaleCamPlane = cur_dis / this.origin_dis;
            this.camPlane.scale.x = scaleCamPlane;
            this.camPlane.scale.y = scaleCamPlane;
            this.camPlane.scale.z = scaleCamPlane
        };
        this.setData = function() {
            this.eyeCenter.position.copy(this.position)
        }
    };
    this._holoClipFrustum = undefined;
    this.bHoloClipFrustumInit = false;
    var CHoloClipFrustum = function(_holoCamCenter,
        _holoScreen) {
        this.holocamcenter = _holoCamCenter;
        this.holoscreen = _holoScreen;
        this.nearPlane = new THREE.Object3D;
        var _length = this.holoscreen.sizeX / 200;
        var halfX = 1 * _length * 100;
        var halfY = 1 * _length * 75;
        var vtx = [];
        vtx.push(new THREE.Vector3(halfX, halfY, 0));
        vtx.push(new THREE.Vector3(halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX, halfY, 0));
        var matLine = new THREE.LineBasicMaterial({
            color: 6710784
        });
        var lineNear = [];
        for (var ii = 0; ii < 4; ii++) {
            var linegeo = new THREE.Geometry;
            linegeo.vertices.push(vtx[ii], vtx[(ii + 1) % 4]);
            lineNear.push(new THREE.Line(linegeo, matLine));
            this.nearPlane.add(lineNear[ii])
        }
        this.nearPlane.name = "nearPlane";
        this.holocamcenter.eyeCenter.add(this.nearPlane);
        this.farPlane = new THREE.Object3D;
        vtx.push(new THREE.Vector3(halfX, halfY, 0));
        vtx.push(new THREE.Vector3(halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX, -halfY, 0));
        vtx.push(new THREE.Vector3(-halfX, halfY, 0));
        var lineFar = [];
        for (var jj = 0; jj < 4; jj++) {
            var linegeo = new THREE.Geometry;
            linegeo.vertices.push(vtx[jj +
                4], vtx[(jj + 1) % 4 + 4]);
            lineFar.push(new THREE.Line(linegeo, matLine));
            this.farPlane.add(lineFar[jj])
        }
        this.farPlane.name = "farPlane";
        this.holocamcenter.eyeCenter.add(this.farPlane);
        this.frustum = new THREE.Object3D;
        var lineFrustum = [];
        for (var kk = 0; kk < 4; kk++) {
            var linegeo = new THREE.Geometry;
            linegeo.vertices.push(new THREE.Vector3(0, 0, 0), this.farPlane.children[kk].geometry.vertices[0]);
            lineFrustum.push(new THREE.Line(linegeo, matLine));
            this.frustum.add(lineFrustum[kk])
        }
        this.holocamcenter.eyeCenter.add(this.frustum);
        var ori_dis = this.holocamcenter.origin_dis;
        var p_z = this.holoscreen.auxBoxUpPlane.position.z * this.holoscreen.scale;
        var n_z = this.holoscreen.auxBoxDownPlane.position.z * this.holoscreen.scale;
        this.nearPlane.position.z = -1 * (ori_dis - p_z);
        this.farPlane.position.z = -1 * (ori_dis - n_z);
        this.distanceNear = -1 * this.nearPlane.position.z;
        this.distanceFar = -1 * this.farPlane.position.z;
        this.farPlane.updateMatrix();
        this.getData = function() {
            var distanceZdp = new THREE.Vector3;
            distanceZdp.copy(this.holocamcenter.eyeCenter.position.clone().sub(this.holoscreen.tarObj.position));
            this.cur_dis = distanceZdp.length();
            var p_z = this.holoscreen.auxBoxUpPlane.position.z * this.holoscreen.scale;
            var n_z = this.holoscreen.auxBoxDownPlane.position.z * this.holoscreen.scale;
            this.nearPlane.position.z = -1 * (this.cur_dis - p_z);
            this.farPlane.position.z = -1 * (this.cur_dis - n_z);
            this.distanceNear = -1 * this.nearPlane.position.z;
            this.distanceFar = -1 * this.farPlane.position.z;
            var _scaleNear = this.holoscreen.scale * Math.abs(this.nearPlane.position.z) / this.cur_dis;
            var _scaleFar = this.holoscreen.scale * Math.abs(this.farPlane.position.z) /
                this.cur_dis;
            this.nearPlane.scale.x = _scaleNear;
            this.nearPlane.scale.y = _scaleNear;
            this.nearPlane.scale.z = _scaleNear;
            this.farPlane.scale.x = _scaleFar;
            this.farPlane.scale.y = _scaleFar;
            this.farPlane.scale.z = _scaleFar;
            for (var ll = 0; ll < 4; ll++) {
                this.frustum.children[ll].geometry.verticesNeedUpdate = true;
                var oldPsoition = new THREE.Vector3;
                oldPsoition.copy(this.farPlane.children[ll].geometry.vertices[0]);
                var matW = new THREE.Matrix4;
                matW = this.farPlane.matrix;
                oldPsoition.applyMatrix4(matW);
                this.frustum.children[ll].geometry.vertices[1] =
                    oldPsoition
            }
        };
        this.setData = function() {
            this.nearPlane.position.z = -1 * this.distanceNear;
            this.farPlane.position.z = -1 * this.distanceFar
        }
    };
    this._depCom = undefined;
    this.bDepComInit = false;
    this.bGlobalViewInit = false;
    this.bGlobalViewInitTiny = false;
    var _globalView;
    this.bHidePanels = false;
    this.bGyroSimViewInit = false;
    var _gyroView;
    var Leia_compute_renderViews = function(scene, camera, renderTarget, forceClear, shiftX, shiftY, _npart) {
        var spanMode = _that._holoCamCenter.spanSphereMode;
        camera.updateMatrix();
        _that._holoCamCenter.eyeCenter.rotation.setFromRotationMatrix(camera.matrix);
        _that._holoCamCenter.eyeCenter.updateMatrix();
        var camPositionCenter = new THREE.Vector3(_that._holoCamCenter.eyeCenter.position.x, _that._holoCamCenter.eyeCenter.position.y, _that._holoCamCenter.eyeCenter.position.z);
        var tmpM = new THREE.Matrix4;
        var tmpV = new THREE.Vector3(camPositionCenter.x - camera.targetPosition.x, camPositionCenter.y - camera.targetPosition.y, camPositionCenter.z - camera.targetPosition.z);
        var npart = 8;
        if (_npart !== undefined) npart = _npart;
        var _d = 0;
        if (shiftX == undefined) shiftX = 0;
        if (shiftY == undefined) shiftY =
            0;
        _that._holoScreen.tarObj.rotation.setFromRotationMatrix(camera.matrix);
        _that._holoScreen.tarObj.updateMatrix();
        camera.near = _that._holoClipFrustum.distanceNear;
        camera.far = _that._holoClipFrustum.distanceFar;
        for (var ii = 0; ii < npart; ii++)
            for (var jj = 0; jj < npart; jj++) {
                if (renderTarget !== undefined) {
                    _that.setViewport(renderTarget.width / npart * ii, renderTarget.height / npart * jj, renderTarget.width / npart, renderTarget.height / npart);
                    _that.setScissor(renderTarget.width / npart * ii, renderTarget.height / npart * jj, renderTarget.width /
                        npart, renderTarget.height / npart)
                } else {
                    _that.setViewport(_canvas.width / npart * ii, _canvas.height / npart * jj, _canvas.width / npart, _canvas.height / npart);
                    _that.setScissor(_viewportWidth / npart * ii, _viewportHeight / npart * jj, _viewportWidth / npart, _viewportHeight / npart)
                }
                _that.enableScissorTest(true);
                var Gradient = new THREE.Vector3;
                var EachTarPos = new THREE.Vector3;
                var camPosition = _that.getCameraPositionByFile(camPositionCenter, camera.targetPosition, camera.up, npart, ii, jj, Gradient, EachTarPos, spanMode, shiftX, shiftY);
                camera.position.x = camPosition.x;
                camera.position.y = camPosition.y;
                camera.position.z = camPosition.z;
                tmpM.lookAt(camera.position, EachTarPos, camera.up);
                camera.quaternion.setFromRotationMatrix(tmpM);
                camera.updateMatrix();
                if (_that._holoScreen.tarObj.geometry.vertices[0] !== undefined) _d = _that.getCameraIntrinsic(camera, _that._holoScreen.tarObj, ii, jj);
                if (renderTarget !== undefined) {
                    renderTarget.sx = renderTarget.width / npart * ii;
                    renderTarget.sy = renderTarget.height / npart * jj;
                    renderTarget.w = renderTarget.width / npart;
                    renderTarget.h =
                        renderTarget.height / npart
                }
                _that._depCom.applyCompress(camera, scene);
                _that.render(scene, camera, renderTarget, forceClear)
            }
        camera.position.x = camPositionCenter.x;
        camera.position.y = camPositionCenter.y;
        camera.position.z = camPositionCenter.z;
        camera.up.set(0, 1, 0);
        if (tmpV.y > 0 && tmpV.y >= Math.abs(tmpV.x) * 2 && tmpV.y >= Math.abs(tmpV.z) * 2) camera.up.set(0, 0, -1);
        camera.lookAt(camera.targetPosition)
    };
    this.stateData = {};
    this.messageCnt = 0;
    this.SetUpRenderStates = function(scene, camera, renderTarget, forceClear, holoScreenSize,
        holoCamFov, upClip, downClip, messageFlag, bAnimate) {
        var _holoCamFov = 50;
        var _holoScreenScale = 1;
        if (holoCamFov !== undefined) _holoCamFov = holoCamFov;
        var _holoScreenSize = 100;
        if (holoScreenSize !== undefined) _holoScreenSize = holoScreenSize;
        if (!this.bHoloCamCenterInit) {
            this._holoCamCenter = new CHoloCamCenter(camera, _holoCamFov);
            this.bHoloCamCenterInit = true;
            this.stateData._camFov = this._holoCamCenter.fov;
            this.stateData._camPosition = new THREE.Vector3(0, 0, 0);
            this.stateData._camPosition.copy(this._holoCamCenter.position);
            this.stateData.bAnimate = this.bRendering
        }
        if (!this.bHoloScreenInit && camera.position.length() >= 0) {
            this._holoScreen = new CHoloScreen(camera, _holoScreenSize, upClip, downClip);
            this.bHoloScreenInit = true;
            this.stateData._holoScreenScale = this._holoScreen.scale;
            this.stateData._holoScreenSize = this._holoScreen.sizeX;
            this.stateData._tarPosition = new THREE.Vector3(0, 0, 0);
            this.stateData._tarPosition.copy(this._holoScreen.position);
            this._holoScreen.tarObj.visible = false;
            this.stateData._upClip = this._holoScreen._up;
            this.stateData._downClip =
                this._holoScreen._down
        }
        if (!this.bHoloClipFrustumInit) {
            this._holoClipFrustum = new CHoloClipFrustum(this._holoCamCenter, this._holoScreen);
            this.bHoloClipFrustumInit = true;
            this.stateData._nearClip = this._holoClipFrustum.distanceNear;
            this.stateData._farClip = this._holoClipFrustum.distanceFar
        }
        if (!this.bShaderManInit) {
            this._shaderManager = new CShaderManager(_that, _viewportWidth, _viewportHeight, this.colorMode);
            this.bShaderManInit = true
        }
        if (messageFlag == undefined) console.log("messageFlag undefined");
        else if (messageFlag ==
            0) {
            this._holoScreen.getData();
            this._holoCamCenter.getData();
            this._holoClipFrustum.getData();
            var bStateChange = false;
            if (this.stateData._camFov != this._holoCamCenter.fov || this.stateData._holoScreenScale != this._holoScreen.scale) bStateChange = true;
            if (this.stateData._camPosition.x != this._holoCamCenter.position.x || this.stateData._camPosition.y != this._holoCamCenter.position.y || this.stateData._camPosition.z != this._holoCamCenter.position.z) bStateChange = true;
            if (this.stateData._tarPosition.x != this._holoScreen.position.x ||
                this.stateData._tarPosition.y != this._holoScreen.position.y || this.stateData._tarPosition.z != this._holoScreen.position.z) bStateChange = true;
            if (this.stateData._nearClip != this._holoClipFrustum.distanceNear || this.stateData._farClip != this._holoClipFrustum.distanceFar) bStateChange = true;
            if (this.stateData._upClip != this._holoScreen._up || this.stateData._downClip != this._holoScreen._down) bStateChange = true;
            if (this.stateData.bAnimate != bAnimate) {
                bStateChange = true;
                this.stateData.bAnimate = bAnimate
            }
            if (bStateChange ==
                true) {
                var message = JSON.stringify({
                    type: "tuning",
                    data: {
                        _camFov: this._holoCamCenter.fov,
                        _camPosition: {
                            x: this._holoCamCenter.position.x,
                            y: this._holoCamCenter.position.y,
                            z: this._holoCamCenter.position.z
                        },
                        _holoScreenScale: this._holoScreen.scale,
                        _holoScreenSize: this._holoScreen.sizeX,
                        _tarPosition: {
                            x: this._holoScreen.position.x,
                            y: this._holoScreen.position.y,
                            z: this._holoScreen.position.z
                        },
                        _nearClip: this._holoClipFrustum.distanceNear,
                        _farClip: this._holoClipFrustum.distanceFar,
                        _upClip: this._holoScreen._up,
                        _downClip: this._holoScreen._down
                    }
                });
                window.top.postMessage(message, "*");
                this.stateData._camFov = this._holoCamCenter.fov;
                this.stateData._camPosition.copy(this._holoCamCenter.position);
                this.stateData._holoScreenScale = this._holoScreen.scale;
                this.stateData._holoScreenSize = this._holoScreen.sizeX;
                this.stateData._tarPosition.copy(this._holoScreen.position);
                this.stateData._nearClip = this._holoClipFrustum.distanceNear;
                this.stateData._farClip = this._holoClipFrustum.distanceFar;
                this.stateData._upClip = this._holoScreen._up;
                this.stateData._downClip = this._holoScreen._down
            }
            var self = this;
            if (bStateChange == true) {
                console.log("post data to emulator");
                (function() {
                    var dataObject = {
                        action: "UpdateDisplayParams"
                    };
                    dataObject.params = JSON.stringify({
                        type: "tuning",
                        data: {
                            _camFov: self._holoCamCenter.fov,
                            _camPosition: {
                                x: self._holoCamCenter.position.x,
                                y: self._holoCamCenter.position.y,
                                z: self._holoCamCenter.position.z
                            },
                            _holoScreenScale: self._holoScreen.scale,
                            _holoScreenSize: self._holoScreen.sizeX,
                            _tarPosition: {
                                x: self._holoScreen.position.x,
                                y: self._holoScreen.position.y,
                                z: self._holoScreen.position.z
                            },
                            _nearClip: self._holoClipFrustum.distanceNear,
                            _farClip: self._holoClipFrustum.distanceFar,
                            _upClip: self._holoScreen._up,
                            _downClip: self._holoScreen._down,
                            _bAnimate: bAnimate
                        }
                    });
                    var xmlhttp = new XMLHttpRequest;
                    xmlhttp.onreadystatechange = function() {
                        if (this.readyState == this.DONE)
                            if (this.status == 200 && this.response != null) {
                                var params = JSON.parse(this.responseText);
                                console.log("Update Display Params:" + this.responseText);
                                return
                            }
                    };
                    xmlhttp.open("POST", "http://127.0.0.1:8887/updateDisplayParams",
                        true);
                    xmlhttp.setRequestHeader("Content-Type", "text/plain");
                    xmlhttp.send(JSON.stringify(dataObject))
                })()
            }
        } else if (messageFlag == 1) {
            this._holoScreen.setData();
            this._holoCamCenter.setData();
            this._holoClipFrustum.setData();
            this.messageCnt++;
            if (this.messageCnt > 5) {
                this.messageCnt = 0;
                var self = this;
                (function() {
                    var xmlhttp = new XMLHttpRequest;
                    xmlhttp.onreadystatechange = function() {
                        if (this.readyState == this.DONE)
                            if (this.status == 200 && this.response != null) {
                                var params = JSON.parse(this.responseText);
                                if (params.data !=
                                    undefined && params.type == "tuning") {
                                    self._holoCamCenter.fov = params.data._camFov.toFixed(2);
                                    self._holoCamCenter.position.x = params.data._camPosition.x.toFixed(2);
                                    self._holoCamCenter.position.y = params.data._camPosition.y.toFixed(2);
                                    self._holoCamCenter.position.z = params.data._camPosition.z.toFixed(2);
                                    self._holoCamCenter.setData();
                                    self._holoScreen.scale = params.data._holoScreenScale.toFixed(2);
                                    self._holoScreen.sizeX = params.data._holoScreenSize.toFixed(2);
                                    self._holoScreen.position.x = params.data._tarPosition.x;
                                    self._holoScreen.position.y = params.data._tarPosition.y;
                                    self._holoScreen.position.z = params.data._tarPosition.z;
                                    self._holoScreen._up = params.data._upClip;
                                    self._holoScreen._down = params.data._downClip;
                                    self._holoScreen.setData();
                                    self._holoClipFrustum.distanceNear = params.data._nearClip;
                                    self._holoClipFrustum.distanceFar = params.data._farClip;
                                    self._holoClipFrustum.setData();
                                    if (self.lastRenderState !== params.data._bAnimate) {
                                        self.bRendering = params.data._bAnimate;
                                        self.lastRenderState = params.data._bAnimate
                                    }
                                }
                                return
                            } else console.log("something wrong")
                    };
                    xmlhttp.open("GET", "http://127.0.0.1:8887/queryDisplayParams", true);
                    xmlhttp.send()
                })()
            }
        } else console.log("messageFlag Error!")
    };
    this.bRendering = true;
    this.material_depth = new THREE.MeshDepthMaterial;
    this.getStillView = false;
    this.Leia_render = function(parameters) {
        parameters = parameters || {};
        var scene, camera, renderTarget, forceClear, holoScreenSize, holoCamFov, upClip, downClip, messageFlag, _filterA, _filterB, _filterC;
        if (parameters.scene == undefined || parameters.camera == undefined) {
            console.log("parameters.scene or parameters.camera can not be Empty!");
            return
        } else {
            scene = parameters.scene;
            camera = parameters.camera
        } if (parameters.holoScreenSize == undefined) holoScreenSize = 40;
        else holoScreenSize = parameters.holoScreenSize; if (parameters.holoCamFov == undefined) holoCamFov = 50;
        else holoCamFov = parameters.holoCamFov;
        upClip = parameters.upclip;
        downClip = parameters.downclip;
        if (parameters.messageFlag == undefined) {
            messageFlag = 0;
            console.log("parameters.messageFlag not defined!")
        } else switch (parameters.messageFlag) {
            case "MessageToIDE":
                messageFlag = 0;
                break;
            case "MessageToEmulator":
                messageFlag =
                    1;
                break;
            default:
                messageFlag = 0
        }
        if (parameters.filterA == undefined) _filterA = .5;
        else _filterA = parameters.filterA; if (parameters.filterB == undefined) _filterB = -.21;
        else _filterB = parameters.filterB; if (parameters.filterC == undefined) _filterC = -.06;
        else _filterC = parameters.filterC;
        renderTarget = parameters.renderTarget;
        forceClear = parameters.forceClear;
        camera.updateMatrix();
        camera.updateMatrixWorld();
        scene.overrideMaterial = null;
        this.SetUpRenderStates(scene, camera, renderTarget, forceClear, holoScreenSize, holoCamFov,
            upClip, downClip, messageFlag, this.bRendering);
        LEIA.time1 = Date.now() * .001;
        if (this.bRendering) LEIA.time = LEIA.time1 - LEIA.time0;
        else {
            LEIA.time0 = LEIA.time1 - LEIA.time;
            LEIA.time = LEIA.time1 - LEIA.time0
        } if (!this.bDepComInit) {
            this._depCom = new DepthCompress(this.compFac);
            this.bDepComInit = true
        }
        if (this.bRendering) {
            this.getStillView = false;
            if (messageFlag !== 1) {
                if (!this.bGlobalViewInit) {
                    _globalView = new CGlobalView({
                        renderer: _that,
                        camera: camera,
                        scene: scene,
                        renderTarget: renderTarget,
                        forceClear: forceClear,
                        canvasWidth: _canvas.width,
                        canvasHeight: _canvas.height
                    });
                    this.bGlobalViewInit = true
                }
                if (this.bGlobalView == true) {
                    if (!this.bTinyMode) {
                        _globalView.setVisibleOn();
                        _globalView.GObserveView = {
                            left: 0,
                            bottom: 0,
                            width: 1,
                            height: 1,
                            up: [0, 1, 0]
                        };
                        _globalView.update()
                    }
                    if (this.bTinyMode) {
                        _globalView.GObserveView = {
                            left: .65,
                            bottom: .2,
                            width: .35,
                            height: .35,
                            up: [0, 1, 0]
                        };
                        _globalView.setVisibleOff();
                        _globalView.update()
                    }
                }
            }
            if (messageFlag == 1 || messageFlag == 0 && this.bGlobalView == false && this.bGyroSimView == false || this.bTinyMode) {
                if (messageFlag == 1) this._depCom.applyCompress(camera,
                    scene);
                if (messageFlag == 0) _globalView.setVisibleOff();
                if (0 == this._renderMode) Leia_compute_renderViews(scene, camera, renderTarget, forceClear, 0, 0, 1);
                else if (1 == this._renderMode) Leia_compute_renderViews(scene, camera, renderTarget, forceClear);
                else if (2 == this._renderMode) {
                    if (this.nShaderMode == 0) Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTarget, forceClear);
                    if (this.nShaderMode == 1 || this.nShaderMode == 2) {
                        Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTarget,
                            forceClear);
                        Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftX, forceClear, .5, 0);
                        Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftY, forceClear, 0, -.5);
                        Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftXY, forceClear, .5, -.5)
                    }
                    if (this.nShaderMode == 3) {
                        Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTarget, forceClear);
                        Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftXY,
                            forceClear, .5, -.5)
                    }
                    this.setViewport(0, 0, _canvas.width, _canvas.height);
                    this.setScissor(0, 0, _viewportWidth, _viewportHeight);
                    this.enableScissorTest(true);
                    if (this.nShaderMode == 0) this._shaderManager.pass(this._shaderManager.basicShader, undefined);
                    if (this.nShaderMode == 1) this._shaderManager.pass(this._shaderManager.SSSShader, undefined);
                    if (this.nShaderMode == 2) {
                        this._shaderManager.pass(this._shaderManager.SSBShader, this._shaderManager._1passRnderTarget);
                        this._shaderManager.pass(this._shaderManager.sharpen_X_Shader,
                            this._shaderManager._2passRnderTarget);
                        this._shaderManager.pass(this._shaderManager.sharpen_Y_Shader, undefined)
                    }
                    if (this.nShaderMode == 3) {
                        if (_filterA !== LEIA.SSBFilterEle_a) {
                            LEIA.SSBFilterEle_a = _filterA;
                            this._shaderManager.resetMaterSSB(LEIA.SSBFilterEle_a)
                        }
                        if (_filterB !== LEIA.SXYFilterEle_b || _filterC !== LEIA.SXYFilterEle_c) {
                            LEIA.SXYFilterEle_b = _filterB;
                            LEIA.SXYFilterEle_c = _filterC;
                            this._shaderManager.resetMaterXYSha(LEIA.SXYFilterEle_b, LEIA.SXYFilterEle_c)
                        }
                        this._shaderManager.pass(this._shaderManager.SSBLiteShader,
                            this._shaderManager._1passRnderTarget);
                        this._shaderManager.pass(this._shaderManager.sharpen_X_Shader, this._shaderManager._2passRnderTarget);
                        this._shaderManager.pass(this._shaderManager.sharpen_Y_Shader, undefined)
                    }
                    if (this.nShaderMode == 4) {
                        var __w = LEIA.SimCanvasWidth;
                        var __h = LEIA.SimCanvasHeight;
                        Leia_compute_renderViews(scene, camera, this._shaderManager._0tiledLarge, forceClear);
                        Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftXYLarge, forceClear, .5, -.5);
                        this.setViewport(0,
                            0, __w, __h);
                        this.setScissor(0, 0, __w, __h);
                        this.enableScissorTest(true);
                        if (_filterA !== LEIA.SSBFilterEle_a) {
                            LEIA.SSBFilterEle_a = _filterA;
                            this._shaderManager.resetMaterSSB(LEIA.SSBFilterEle_a)
                        }
                        if (_filterB !== LEIA.SXYFilterEle_b || _filterC !== LEIA.SXYFilterEle_c) {
                            LEIA.SXYFilterEle_b = _filterB;
                            LEIA.SXYFilterEle_c = _filterC;
                            this._shaderManager.resetMaterXYSha(LEIA.SXYFilterEle_b, LEIA.SXYFilterEle_c)
                        }
                        this._shaderManager.pass(this._shaderManager.SSBLiteSimShader, this._shaderManager._01passSimRnderTarget);
                        this._shaderManager.pass(this._shaderManager.sharpen_X_Sim_Shader,
                            this._shaderManager._02passSimRnderTarget);
                        this._shaderManager.pass(this._shaderManager.sharpen_Y_Sim_Shader, this._shaderManager._1passSimRnderTarget);
                        if (this.bTinyMode) {
                            var _left = Math.floor(_viewportWidth * this.GTinyView.left);
                            var _bottom = Math.floor(_viewportHeight * this.GTinyView.bottom);
                            var _width = Math.floor(__w * this.GTinyView.width);
                            var _height = Math.floor(__h * this.GTinyView.height);
                            this.setViewport(_left, _bottom, _width, _height);
                            this.setScissor(_left, _bottom, _width, _height);
                            this.enableScissorTest(true)
                        }
                        if (messageFlag ==
                            0)
                            if (_globalView.selectedView.x >= 0 && _globalView.selectedView.y >= 0)
                                if (this._shaderManager.interI != _globalView.selectedView.x || this._shaderManager.interJ != _globalView.selectedView.y) {
                                    this._shaderManager.indexI = Math.round(_globalView.selectedView.x);
                                    this._shaderManager.indexJ = Math.round(_globalView.selectedView.y);
                                    this._shaderManager.interI = _globalView.selectedView.x;
                                    this._shaderManager.interJ = _globalView.selectedView.y;
                                    this._shaderManager.resetMaterViewSim()
                                }
                        this._shaderManager.pass(this._shaderManager.viewSimShader,
                            undefined)
                    }
                } else console.log("renderMode error!")
            }
            if (this.bGyroSimView)
                if (!this.bGyroSimViewInit) {
                    _gyroView = new CGyroView({
                        renderer: _that,
                        renderTarget: renderTarget,
                        forceClear: forceClear,
                        canvasWidth: _canvas.width,
                        canvasHeight: _canvas.height
                    });
                    this.bGyroSimViewInit = true
                } else _gyroView.update()
        } else if (!this.getStillView && 2 == this.curMode) {
            if (messageFlag !== 1) _globalView.setVisibleOff();
            Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTarget, forceClear);
            Leia_compute_renderViews(scene,
                camera, this._shaderManager._swizzleRenderTargetSftX, forceClear, .5, 0);
            Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftY, forceClear, 0, -.5);
            Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftXY, forceClear, .5, -.5);
            this.setViewport(0, 0, _canvas.width, _canvas.height);
            this.setScissor(0, 0, _viewportWidth, _viewportHeight);
            this.enableScissorTest(true);
            this._shaderManager.pass(this._shaderManager.SSSShader, undefined);
            this.getStillView = true
        }
    };
    this.holo_render =
        function(scene, camera, RenderTarget, forceClear, bTinyMode) {
            Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTarget, forceClear);
            if (this.nShaderMode == 1 || this.nShaderMode == 2) {
                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftX, forceClear, .5, 0);
                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftY, forceClear, 0, -.5);
                Leia_compute_renderViews(scene, camera, this._shaderManager._swizzleRenderTargetSftXY, forceClear, .5, -.5)
            }
            if (bTinyMode) {
                var _left =
                    Math.floor(_canvas.width * this.GTinyView.left);
                var _bottom = Math.floor(_canvas.height * this.GTinyView.bottom);
                var _width = Math.floor(_canvas.width * this.GTinyView.width);
                var _height = Math.floor(_canvas.height * this.GTinyView.height);
                this.setViewport(_left, _bottom, _width, _height);
                this.setScissor(_left, _bottom, _width, _height)
            } else {
                this.setViewport(0, 0, _canvas.width, _canvas.height);
                this.setScissor(0, 0, _viewportWidth, _viewportHeight)
            }
            this.enableScissorTest(true);
            if (this.nShaderMode == 0) this._shaderManager.pass(this._shaderManager.basicShader,
                undefined);
            if (this.nShaderMode == 1) this._shaderManager.pass(this._shaderManager.SSSShader, undefined);
            if (this.nShaderMode == 2) this._shaderManager.pass(this._shaderManager.SSBShader, undefined);
            if (this.nShaderMode == 3) {
                this._shaderManager.pass(this._shaderManager.basicShader, this._shaderManager._1passRnderTarget);
                this._shaderManager.pass(this._shaderManager.viewSimShader, undefined)
            }
    }
};
LeiaWebGLRenderer.prototype = Object.create(THREE.WebGLRenderer.prototype);
var CShaderManager = function(leia_renderer, _viewportWidth, _viewportHeight, color) {
    this.renderer = leia_renderer;
    this._swizzleRenderTarget = undefined;
    this.cameraSWIZZLE = undefined;
    this.LEIA_output;
    this.swizzleMesh;
    this._swizzleRenderTargetSftX;
    this._swizzleRenderTargetSftY;
    this._swizzleRenderTargetSftXY;
    this._swizzleRenderTargetSSS;
    this._DepthRenderTarget;
    this._1passRnderTarget;
    this.width = _viewportWidth;
    this.height = _viewportHeight;
    this.color = color;
    this.swizzle = true;
    var simWholeSizeX = LEIA.SimCanvasWidth;
    var simWholeSizeY = LEIA.SimCanvasHeight;
    this.indexI = 2;
    this.indexJ = 5;
    this.interI = 0;
    this.interJ = 0;
    this.nnc = 1;
    this.nncx_l = .8;
    this.nncx_r = .8;
    this.nncy_u = .8;
    this.nncy_d = .8;
    this.nncx_lu = .3;
    this.nncx_ru = .3;
    this.nncy_rd = .3;
    this.nncy_ld = .3;
    var _this = this;
    this.cameraSWIZZLE = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, -1, 1);
    this.cameraSWIZZLE.position.z = 0;
    this.LEIA_output = new THREE.Scene;
    if (this.LEIA_output.children.length > 0) this.LEIA_output.remove(this.swizzleMesh);
    var swizzleBackgroundGeometry =
        new THREE.PlaneGeometry(this.width, this.height);
    this.swizzleMesh = new THREE.Mesh(swizzleBackgroundGeometry);
    this.LEIA_output.add(this.swizzleMesh);
    this.pass = function(shader, target) {
        this.swizzleMesh.material = shader.material;
        this.renderer.render(this.LEIA_output, this.cameraSWIZZLE, target, false)
    };
    this._swizzleRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._swizzleRenderTargetSftX = new THREE.WebGLRenderTarget(this.width,
        this.height, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        });
    this._swizzleRenderTargetSftY = new THREE.WebGLRenderTarget(this.width, this.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._swizzleRenderTargetSftXY = new THREE.WebGLRenderTarget(this.width, this.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._swizzleRenderTarget.generateMipmaps = false;
    this._swizzleRenderTargetSftX.generateMipmaps =
        false;
    this._swizzleRenderTargetSftY.generateMipmaps = false;
    this._swizzleRenderTargetSftXY.generateMipmaps = false;
    this._1passRnderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._1passRnderTarget.generateMipmaps = false;
    this._2passRnderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._2passRnderTarget.generateMipmaps =
        false;
    this._1passSimRnderTarget = new THREE.WebGLRenderTarget(simWholeSizeX, simWholeSizeY, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._1passSimRnderTarget.generateMipmaps = false;
    this._0tiledLarge = new THREE.WebGLRenderTarget(simWholeSizeX, simWholeSizeY, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._0tiledLarge.generateMipmaps = false;
    this._01passSimRnderTarget = new THREE.WebGLRenderTarget(simWholeSizeX, simWholeSizeY, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._01passSimRnderTarget.generateMipmaps = false;
    this._02passSimRnderTarget = new THREE.WebGLRenderTarget(simWholeSizeX, simWholeSizeY, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._02passSimRnderTarget.generateMipmaps = false;
    this._swizzleRenderTargetSftXYLarge = new THREE.WebGLRenderTarget(simWholeSizeX, simWholeSizeY, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
    this._swizzleRenderTargetSftXYLarge.generateMipmaps = false;

    function LEIA_getSwizzlePixel() {
        var snipplet;
        snipplet = _this.color ? "vec4" : "float";
        snipplet += " getPixel( in float amplitude, in sampler2D texture, in vec2 viewId, in vec2 sPixId) {  \n";
        snipplet += "vec2 id  = vec2( ( sPixId.s + viewId.s*renderSize.x/8.0 )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t*renderSize.y/8.0 )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n" + "vec4 p   = texture2D( texture, id );\n";
        if (_this.color) snipplet += "    p =  amplitude * p;\n" + "return p ;\n";
        else snipplet += "    float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" + "return pb ;\n";
        snipplet += "}\n";
        return snipplet
    }

    function LEIA_getSimPixel() {
        var snipplet;
        snipplet = _this.color ? "vec4" : "float";
        snipplet += " getPixel( in float amplitude, in sampler2D texture, in vec2 viewId, in vec2 sPixId) {  \n";
        if (_this.swizzle) snipplet += "vec2 id  = vec2( ( sPixId.s*8.0 + viewId.s              )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t*8.0 + viewId.t              )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n";
        else snipplet += "vec2 id  = vec2( ( sPixId.s + viewId.s*renderSize.x/8.0 )/renderSize.x + 1.0/(2.0*renderSize.x), ( sPixId.t + viewId.t*renderSize.y/8.0 )/renderSize.y+ 1.0/(2.0*renderSize.y) ); \n";
        snipplet += "vec4 p   = texture2D( texture, id );\n";
        if (_this.color) snipplet += "    p =  amplitude * p;\n" + "return p ;\n";
        else snipplet += "    float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" + "return pb ;\n";
        snipplet += "}\n";
        return snipplet
    }

    function LEIA_getDirectPixel() {
        var snipplet;
        snipplet = _this.color ?
            "vec4" : "float";
        snipplet += " getPixel( in float amplitude, in sampler2D texture, in vec2 vUv, in float DX, in float DY) {  \n";
        snipplet += "vec2 id  = vec2(vUv.s + DX*1.0/renderSize.x ,vUv.t + DY*1.0/renderSize.y ); \n" + "vec4 p   = texture2D( texture, id );\n";
        if (_this.color) snipplet += "    p = amplitude * p;\n" + "return p ;\n";
        else snipplet += "    float pb = amplitude * ( p.r + p.g + p.b ) / 3.0;\n" + "return pb ;\n";
        snipplet += "}\n";
        return snipplet
    }

    function LEIA_mainStart() {
        var tileWidth = _this.width / 8;
        var tileHeight =
            _this.height / 8;
        var snipplet = "void main() { \n";
        snipplet += "vec2 pixelCoord = vec2( floor((vUv.s)*renderSize.x), floor(vUv.t*renderSize.y) ); ";
        snipplet += "pixelCoord      = vec2(max(pixelCoord.s - 0.0, 0.0), max(pixelCoord.t - 0.0, 0.0));";
        if (_this.swizzle) {
            snipplet += "    vec2 viewId     = vec2(   mod(pixelCoord.s,8.0)  ,   mod(pixelCoord.t,8.0)  );  \n";
            snipplet += "    vec2 sPixId     = vec2( floor(pixelCoord.s/8.0)  , floor(pixelCoord.t/8.0)  ); \n"
        } else snipplet += "    vec2 sPixId     = vec2(   mod(pixelCoord.s, " +
            tileWidth.toFixed(2) + ")  ,   mod(pixelCoord.t, " + tileHeight.toFixed(2) + ")  ); \n" + "    vec2 viewId     = vec2( floor(pixelCoord.s/" + tileWidth.toFixed(2) + ")  , floor(pixelCoord.t/" + tileHeight.toFixed(2) + ")  ); \n"; if (_this.color) snipplet += "    vec4 fc         = vec4(0.0, 0.0, 0.0, 1.0); \n";
        else snipplet += "    float fc        = 0.0;\n";
        return snipplet
    }

    function LEIA_mainFinish() {
        var diagonalAttenuation = 0;
        var pixelAdjust0 = 0;
        var pixelAdjust1 = 1;
        var pixelAdjust2 = 0;
        var fader = 1;
        var snipplet = "    float screenCorrection = 1.0;\n";
        snipplet += "    float diagCompensation = 1.0-" + diagonalAttenuation.toFixed(2) + "*exp(-(1.0-vUv.s*vUv.s+vUv.t*vUv.t));\n";
        snipplet += "    screenCorrection = diagCompensation;\n";
        if (_this.color) snipplet += "    vec4 fc2 = vec4(fc.r*fc.r, fc.g*fc.g, fc.r*fc.r, 1.0);\n";
        else snipplet += "    float fc2 = fc*fc;\n";
        snipplet += "    fc = screenCorrection*" + fader.toFixed(2) + "*(" + pixelAdjust0.toFixed(2) + "+" + pixelAdjust1.toFixed(2) + "*fc+" + pixelAdjust2.toFixed(2) + "*fc2);\n";
        if (_this.color) {
            snipplet += "    fc.r = min(max(fc.r, 0.0), 1.0);\n";
            snipplet += "    fc.g = min(max(fc.g, 0.0), 1.0);\n";
            snipplet += "    fc.b = min(max(fc.b, 0.0), 1.0);\n";
            snipplet += "    gl_FragColor = vec4(fc.r, fc.g, fc.b, 1.0);\n"
        } else {
            snipplet += "    fc = min(max(fc, 0.0), 1.0);\n";
            snipplet += "    gl_FragColor = vec4(fc, fc, fc, 1.0);\n"
        }
        snipplet += "}\n";
        return snipplet
    }
    var _SwizzleVertexShaderSrc = "varying vec2 vUv;" + "void main() {" + "    vUv = uv;" + "    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );" + "}";
    var _BasicSwizzleSrc = "precision highp float;" +
        "varying  vec2 vUv; \t\t\t\n" + "uniform sampler2D tNormal; \t\t\t\n" + "uniform vec2 renderSize;              \n " + LEIA_getSwizzlePixel() + LEIA_mainStart() + "fc = getPixel( 1.0, tNormal, viewId, sPixId);" + LEIA_mainFinish();
    var CBasicShader = function() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._swizzleRenderTarget
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(_this.width, _this.height)
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _BasicSwizzleSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.basicShader = new CBasicShader;
    var invA_66 = [-.0197, -.0271, .0864, .146, .0306, -.1038, -.0271, -.0373, .1189, .2011, .0422, -.143, .0393, .0542, -.0946, -.1845, -.4679, -.4598, .0813, .1119, -.2493, -.4552, -.6865, -.4902, .0545, .075, -.3056, -.4959, 1.2043, 2.1543, -.0063, -.0086, -.1716, -.2276, 2.3449, 3.4569];
    var _SSSSwizzleFragmentShaderSrc = "precision highp float;" + "varying  vec2 vUv; \t\t\t\n" + "uniform sampler2D tNormal; \t\t\t\n" + "uniform sampler2D tSuperX; \t\t\t\n" + "uniform sampler2D tSuperY; \t\t\t\n" +
        "uniform sampler2D tSuperD; \t\t\t\n" + "uniform vec2 renderSize;              \n " + "uniform float invASSS[36];                \n" + LEIA_getSwizzlePixel() + LEIA_mainStart() + "float coeff = 0.0;" + "if (viewId.s>=3.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t-3.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t-3.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t-3.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t-3.00), sPixId);}};\n" +
        "                   {if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 5];fc = fc+getPixel(invASSS[0*6 + 5],tSuperY, vec2(viewId.s,      viewId.t-3.00), sPixId);}};\n" + "                   {if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s,      viewId.t-3.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t-3.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t-3.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t>=3.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t-3.00), sPixId);}};\n" +
        "if (viewId.s>=3.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" + "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 5];fc = fc+getPixel(invASSS[1*6 + 5],tNormal, vec2(viewId.s,      viewId.t-2.00), sPixId);}};\n" +
        "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s,      viewId.t-2.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s <6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s>=3.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t-2.00), sPixId);}};\n" + "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 5];fc = fc+getPixel(invASSS[2*6 + 5],tSuperY, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" + "                   {if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t>=2.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t-2.00), sPixId);}};\n" +
        "if (viewId.s>=3.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" + "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 5];fc = fc+getPixel(invASSS[3*6 + 5],tNormal, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" + "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s>=3.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t-1.00), sPixId);}};\n" +
        "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 5];fc = fc+getPixel(invASSS[4*6 + 5],tSuperY, vec2(viewId.s,      viewId.t-1.00), sPixId);}};\n" + "                   {if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s,      viewId.t-1.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t>=1.00){ coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t-1.00), sPixId);}};\n" +
        "if (viewId.s>=3.00){                   { coeff = coeff+invASSS[5*6 + 0];fc = fc+getPixel(invASSS[5*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[5*6 + 1];fc = fc+getPixel(invASSS[5*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[5*6 + 2];fc = fc+getPixel(invASSS[5*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[5*6 + 3];fc = fc+getPixel(invASSS[5*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[5*6 + 4];fc = fc+getPixel(invASSS[5*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" + "                   {                   { coeff = coeff+invASSS[5*6 + 5];fc = fc+getPixel(invASSS[5*6 + 5],tNormal, vec2(viewId.s, viewId.t), sPixId);}};\n" + "                   {                   { coeff = coeff+invASSS[5*6 + 4];fc = fc+getPixel(invASSS[5*6 + 4],tSuperX, vec2(viewId.s, viewId.t), sPixId);}};\n" + "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[5*6 + 3];fc = fc+getPixel(invASSS[5*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[5*6 + 2];fc = fc+getPixel(invASSS[5*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" + "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[5*6 + 1];fc = fc+getPixel(invASSS[5*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" + "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[5*6 + 0];fc = fc+getPixel(invASSS[5*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=3.00){                   { coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=2.00){                   { coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=1.00){                   { coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t), sPixId);}};\n" +
        "                   {                   { coeff = coeff+invASSS[4*6 + 5];fc = fc+getPixel(invASSS[4*6 + 5],tSuperY, vec2(viewId.s,      viewId.t), sPixId);}};\n" + "                   {                   { coeff = coeff+invASSS[4*6 + 4];fc = fc+getPixel(invASSS[4*6 + 4],tSuperD, vec2(viewId.s,      viewId.t), sPixId);}};\n" + "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[4*6 + 3];fc = fc+getPixel(invASSS[4*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" + "if (viewId.s< 7.00){                   { coeff = coeff+invASSS[4*6 + 2];fc = fc+getPixel(invASSS[4*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t), sPixId);}};\n" +
        "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[4*6 + 1];fc = fc+getPixel(invASSS[4*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" + "if (viewId.s< 6.00){                   { coeff = coeff+invASSS[4*6 + 0];fc = fc+getPixel(invASSS[4*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t), sPixId);}};\n" + "if (viewId.s>=3.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" + "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 5];fc = fc+getPixel(invASSS[3*6 + 5],tNormal, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" +
        "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 4];fc = fc+getPixel(invASSS[3*6 + 4],tSuperX, vec2(viewId.s, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 3];fc = fc+getPixel(invASSS[3*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 2];fc = fc+getPixel(invASSS[3*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 1];fc = fc+getPixel(invASSS[3*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[3*6 + 0];fc = fc+getPixel(invASSS[3*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s>=3.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t+1.00), sPixId);}};\n" + "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 5];fc = fc+getPixel(invASSS[2*6 + 5],tSuperY, vec2(viewId.s,      viewId.t+1.00), sPixId);}};\n" + "                   {if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 4];fc = fc+getPixel(invASSS[2*6 + 4],tSuperD, vec2(viewId.s,      viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 3];fc = fc+getPixel(invASSS[2*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 2];fc = fc+getPixel(invASSS[2*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 1];fc = fc+getPixel(invASSS[2*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t<7.00){ coeff = coeff+invASSS[2*6 + 0];fc = fc+getPixel(invASSS[2*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t+1.00), sPixId);}};\n" +
        "if (viewId.s>=3.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s-3.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" + "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 5];fc = fc+getPixel(invASSS[1*6 + 5],tNormal, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" + "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 4];fc = fc+getPixel(invASSS[1*6 + 4],tSuperX, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 3];fc = fc+getPixel(invASSS[1*6 + 3],tNormal, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 2];fc = fc+getPixel(invASSS[1*6 + 2],tSuperX, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 1];fc = fc+getPixel(invASSS[1*6 + 1],tNormal, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s <6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[1*6 + 0];fc = fc+getPixel(invASSS[1*6 + 0],tSuperX, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s>=3.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s-3.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s>=2.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s-2.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s>=1.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s-1.00, viewId.t+2.00), sPixId);}};\n" +
        "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 5];fc = fc+getPixel(invASSS[0*6 + 5],tSuperY, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" + "                   {if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 4];fc = fc+getPixel(invASSS[0*6 + 4],tSuperD, vec2(viewId.s, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 3];fc = fc+getPixel(invASSS[0*6 + 3],tSuperY, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s< 7.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 2];fc = fc+getPixel(invASSS[0*6 + 2],tSuperD, vec2(viewId.s+1.00, viewId.t+2.00), sPixId);}};\n" +
        "if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 1];fc = fc+getPixel(invASSS[0*6 + 1],tSuperY, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" + "if (viewId.s< 6.00){if (viewId.t<6.00){ coeff = coeff+invASSS[0*6 + 0];fc = fc+getPixel(invASSS[0*6 + 0],tSuperD, vec2(viewId.s+2.00, viewId.t+2.00), sPixId);}};\n" + "fc = fc/coeff;" + LEIA_mainFinish();
    var CSSSSShader = function() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._swizzleRenderTarget
                },
                "tSuperX": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftX
                },
                "tSuperY": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftY
                },
                "tSuperD": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftXY
                },
                "invASSS": {
                    type: "fv1",
                    value: invA_66
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(_this.width, _this.height)
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SSSSwizzleFragmentShaderSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.SSSShader = new CSSSSShader;
    var _SuperSampleLiteFragmentShaderSrc = "precision highp float;" +
        "varying  vec2 vUv; \t\t\t\n" + "uniform sampler2D tNormal; \t\t\t\n" + "uniform sampler2D tSuperD; \t\t\t\n" + "uniform vec2 renderSize;              \n " + "uniform float filter[9]; \n" + LEIA_getSwizzlePixel() + LEIA_mainStart() + "float imgCoeff = filter[4]; \n" + "float nnCoeff =  filter[1]; \n" + "float nxnCoeff = filter[0]; \n" + "float coeff = imgCoeff + nxnCoeff;" + "fc = getPixel(imgCoeff, tNormal, viewId, sPixId);" + "fc = fc+getPixel( nxnCoeff, tSuperD, viewId, sPixId );" + "if (viewId.s > 0.0) { \n" + "   coeff = coeff + nxnCoeff;" +
        "   fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(1.0, 0.0), sPixId );" + "}\n" + "if (viewId.t > 0.0) { \n" + "   coeff = coeff + nxnCoeff;" + "   fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(0.0, 1.0), sPixId );" + "   if (viewId.s > 0.0) { \n" + "       coeff = coeff + nxnCoeff;" + "       fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(1.0, 1.0), sPixId );" + "   }\n" + "}\n" + "fc = fc/coeff;" + LEIA_mainFinish();
    var CSuperSampleLiteShader = function(a) {
        var _a = a;
        this.nFilter = [_a * _a, _a, _a * _a, _a, 1, _a, _a * _a, _a,
            _a * _a
        ];
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._swizzleRenderTarget
                },
                "tSuperD": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftXY
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(_this.width, _this.height)
                },
                "filter": {
                    type: "fv1",
                    value: this.nFilter
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SuperSampleLiteFragmentShaderSrc,
            depthWrite: false
        })
    };
    this.SSBLiteShader = new CSuperSampleLiteShader(LEIA.SSBFilterEle_a);
    var _SuperSampleSwizzleFragmentShaderSrc =
        "precision highp float;" + "varying  vec2 vUv; \t\t\t\n" + "uniform sampler2D tNormal; \t\t\t\n" + "uniform sampler2D tSuperX; \t\t\t\n" + "uniform sampler2D tSuperY; \t\t\t\n" + "uniform sampler2D tSuperD; \t\t\t\n" + "uniform vec2 renderSize;              \n " + LEIA_getSwizzlePixel() + LEIA_mainStart() + "fc = getPixel( 1.0, tNormal, viewId, sPixId);" + "float imgCoeff = 1.0;" + "float nnCoeff = 0.5;" + "float nxnCoeff = 0.25;" + "float coeff = imgCoeff+2.0*nnCoeff+nxnCoeff;" + "fc =    getPixel( imgCoeff, tNormal, viewId, sPixId );" +
        "fc = fc+getPixel(  nnCoeff, tSuperX, viewId, sPixId );" + "fc = fc+getPixel(  nnCoeff, tSuperY, viewId, sPixId );" + "fc = fc+getPixel( nxnCoeff, tSuperD, viewId, sPixId );" + "if (viewId.s > 0.0) { \n" + "   coeff = coeff + nnCoeff + nxnCoeff;" + "   fc = fc+getPixel( nnCoeff, tSuperX, viewId-vec2(1.0, 0.0), sPixId );" + "   fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(1.0, 0.0), sPixId );" + "}\n" + "if (viewId.t > 0.0) { \n" + "   coeff = coeff + nnCoeff + nxnCoeff;" + "   fc = fc+getPixel( nnCoeff, tSuperY, viewId-vec2(0.0, 1.0), sPixId );" +
        "   fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(0.0, 1.0), sPixId );" + "   if (viewId.s > 0.0) { \n" + "       coeff = coeff + nxnCoeff;" + "       fc = fc+getPixel( nxnCoeff, tSuperD, viewId-vec2(1.0, 1.0), sPixId );" + "   }\n" + "}\n" + "fc = fc/coeff;" + LEIA_mainFinish();
    var CSuperSampleShader = function() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._swizzleRenderTarget
                },
                "tSuperX": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftX
                },
                "tSuperY": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftY
                },
                "tSuperD": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftXY
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(_this.width, _this.height)
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SuperSampleSwizzleFragmentShaderSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.SSBShader = new CSuperSampleShader;
    var _SharpenASrc = "varying vec2 vUv;\n " + "uniform float fader;\n " + "uniform sampler2D tNormal;\n " + "uniform float filter[25];                              \n " + "uniform vec2 renderSize;              \n " +
        "\n " + LEIA_getDirectPixel() + LEIA_mainStart() + "\tfloat coeff = 0.0;\n " + "\tfor(int DY = -2; DY <= 2; DY++)\n " + "\t\tfor(int DX = -2; DX <= 2; DX++){\n " + "\t\t\tfloat dW = filter[(DY + 2)*5 + DX + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\n " + "\tfc = fc / coeff;\n " + LEIA_mainFinish();
    var nFilter = [.0036, .0126, -.06, .0126, .0036, .0126, .0441, -.21, .0441, .0126, -.06, -.21, 1, -.21, -.06, .0126, .0441, -.21, .0441, .0126, .0036, .0126, -.06,
        .0126, .0036
    ];
    var CSharpenAllShader = function() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._1passRnderTarget
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(_this.width, _this.height)
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "filter": {
                    type: "fv1",
                    value: nFilter
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SharpenASrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.sharpen_A_Shader = new CSharpenAllShader;
    var _SharpenXSrc = "varying vec2 vUv;\n " + "uniform float fader;\n " +
        "uniform sampler2D tNormal;\n " + "uniform float filter[5];                              \n " + "uniform vec2 renderSize;              \n " + "\n " + LEIA_getDirectPixel() + LEIA_mainStart() + "\tfloat coeff = 0.0;\n " + " int DY = 0;\n" + " if(viewId.s>=2.0&&viewId.s<=5.0) {\n" + "\t\tfor(int DX = -2; DX <= 2; DX++){\n " + "\t\t\tfloat dW = filter[ DX + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + " if(viewId.s==0.0) {\n" + "\t\tfor(int DX = 0; DX <= 2; DX++){\n " +
        "\t\t\tfloat dW = filter[ DX + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + " if(viewId.s==1.0) {\n" + "\t\tfor(int DX = -1; DX <= 2; DX++){\n " + "\t\t\tfloat dW = filter[ DX + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + " if(viewId.s==6.0) {\n" + "\t\tfor(int DX = -2; DX <= 1; DX++){\n " + "\t\t\tfloat dW = filter[ DX + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " +
        "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + " if(viewId.s==7.0) {\n" + "\t\tfor(int DX = -2; DX <= 0; DX++){\n " + "\t\t\tfloat dW = filter[ DX + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + "\n " + "\tfc = fc / coeff;\n " + LEIA_mainFinish();
    var CSharpenXShader = function(b, c) {
        var _b = b;
        var _c = c;
        var nFilter = [_c, _b, 1, _b, _c];
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._1passRnderTarget
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(_this.width, _this.height)
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "filter": {
                    type: "fv1",
                    value: nFilter
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SharpenXSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.sharpen_X_Shader = new CSharpenXShader(LEIA.SXYFilterEle_b, LEIA.SXYFilterEle_c);
    var _SharpenYSrc = "varying vec2 vUv;\n " + "uniform float fader;\n " + "uniform sampler2D tNormal;\n " + "uniform float filter[5];                              \n " +
        "uniform vec2 renderSize;              \n " + "\n " + LEIA_getDirectPixel() + LEIA_mainStart() + " int DX = 0;\n" + "\tfloat coeff = 0.0;\n " + " if(viewId.t>=2.0&&viewId.t<=5.0) {\n" + "\t\tfor(int DY = -2; DY <= 2; DY++){\n " + "\t\t\tfloat dW = filter[ DY + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + " if(viewId.t==0.0) {\n" + "\t\tfor(int DY = 0; DY <= 2; DY++){\n " + "\t\t\tfloat dW = filter[ DY + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " +
        "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + " if(viewId.t==1.0) {\n" + "\t\tfor(int DY = -1; DY <= 2; DY++){\n " + "\t\t\tfloat dW = filter[ DY + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + " if(viewId.t==6.0) {\n" + "\t\tfor(int DY = -2; DY <= 1; DY++){\n " + "\t\t\tfloat dW = filter[ DY + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " +
        "\t\t}\n " + "\t}\n " + " if(viewId.t==7.0) {\n" + "\t\tfor(int DY = -2; DY <= 0; DY++){\n " + "\t\t\tfloat dW = filter[ DY + 2];\n " + "\t\t\tcoeff = coeff + dW;\n " + "\t\t\tfc = fc + getPixel( dW, tNormal, vUv, float(DX), float(DY));\n " + "\t\t}\n " + "\t}\n " + "\n " + "\tfc = fc / coeff;\n " + LEIA_mainFinish();
    var CSharpenYShader = function(b, c) {
        var _b = b;
        var _c = c;
        var nFilter = [_c, _b, 1, _b, _c];
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._2passRnderTarget
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(_this.width, _this.height)
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "filter": {
                    type: "fv1",
                    value: nFilter
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SharpenYSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.sharpen_Y_Shader = new CSharpenYShader(LEIA.SXYFilterEle_b, LEIA.SXYFilterEle_c);
    var CSim1stPassShader = function() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._0tiledLarge
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(simWholeSizeX, simWholeSizeY)
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _BasicSwizzleSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.sim1stPassShader = new CSim1stPassShader;
    var CSuperSampleLiteSimShader = function(a) {
        var _a = a;
        this.nFilter = [_a * _a, _a, _a * _a, _a, 1, _a, _a * _a, _a, _a * _a];
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._0tiledLarge
                },
                "tSuperD": {
                    type: "t",
                    value: _this._swizzleRenderTargetSftXYLarge
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(simWholeSizeX,
                        simWholeSizeY)
                },
                "filter": {
                    type: "fv1",
                    value: this.nFilter
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SuperSampleLiteFragmentShaderSrc,
            depthWrite: false
        })
    };
    this.SSBLiteSimShader = new CSuperSampleLiteSimShader(LEIA.SSBFilterEle_a);
    this.resetMaterSSB = function(a) {
        this.SSBLiteShader = new CSuperSampleLiteShader(a);
        this.SSBLiteSimShader = new CSuperSampleLiteSimShader(a)
    };
    var CSharpenXSimShader = function(b, c) {
        var _b = b;
        var _c = c;
        var nFilter = [_c, _b, 1, _b, _c];
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._01passSimRnderTarget
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(simWholeSizeX, simWholeSizeY)
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "filter": {
                    type: "fv1",
                    value: nFilter
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SharpenXSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.sharpen_X_Sim_Shader = new CSharpenXSimShader(LEIA.SXYFilterEle_b, LEIA.SXYFilterEle_c);
    var CSharpenYSimShader = function(b, c) {
        var _b = b;
        var _c = c;
        var nFilter = [_c, _b, 1, _b, _c];
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tNormal": {
                    type: "t",
                    value: _this._02passSimRnderTarget
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(simWholeSizeX, simWholeSizeY)
                },
                "fader": {
                    type: "f",
                    value: 1
                },
                "filter": {
                    type: "fv1",
                    value: nFilter
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _SharpenYSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.sharpen_Y_Sim_Shader = new CSharpenYSimShader(LEIA.SXYFilterEle_b, LEIA.SXYFilterEle_c);
    this.resetMaterXYSha = function(b, c) {
        this.sharpen_X_Shader = new CSharpenXShader(c, b);
        this.sharpen_Y_Shader = new CSharpenXShader(c,
            b);
        this.sharpen_X_Sim_Shader = new CSharpenXSimShader(c, b);
        this.sharpen_Y_Sim_Shader = new CSharpenYSimShader(c, b)
    };
    var _viewSimSrc = "varying vec2 vUv;\n " + "uniform float fader;\n " + "uniform sampler2D tScreenViews;\n " + "uniform float selViewIdX, selViewIdY, nnc, nncx_l, nncx_r, nncy_u, nncy_d, nncx_lu, nncx_ru, nncy_ld, nncy_rd;                              \n " + "uniform vec2 renderSize;              \n " + "\n " + LEIA_getSimPixel() + LEIA_mainStart() + "    fc = getPixel( nnc, tScreenViews, vec2(selViewIdX, selViewIdY), sPixId);\n" +
        "    fc = fc + getPixel( nncx_r, tScreenViews, vec2(mod(selViewIdX+1.0, 8.0), mod(selViewIdY+0.0, 8.0)), sPixId);\n" + "    fc = fc + getPixel( nncx_l, tScreenViews, vec2(mod(selViewIdX+7.0, 8.0), mod(selViewIdY+0.0, 8.0)), sPixId);\n" + "    fc = fc + getPixel( nncy_u, tScreenViews, vec2(mod(selViewIdX+0.0, 8.0), mod(selViewIdY+1.0, 8.0)), sPixId);\n" + "    fc = fc + getPixel( nncy_d, tScreenViews, vec2(mod(selViewIdX+0.0, 8.0), mod(selViewIdY+7.0, 8.0)), sPixId);\n" + "    fc = fc + getPixel( nncx_ru, tScreenViews, vec2(mod(selViewIdX+1.0, 8.0), mod(selViewIdY+1.0, 8.0)), sPixId);\n" +
        "    fc = fc + getPixel( nncx_lu, tScreenViews, vec2(mod(selViewIdX+7.0, 8.0), mod(selViewIdY+1.0, 8.0)), sPixId);\n" + "    fc = fc + getPixel( nncy_rd, tScreenViews, vec2(mod(selViewIdX+1.0, 8.0), mod(selViewIdY+7.0, 8.0)), sPixId);\n" + "    fc = fc + getPixel( nncy_ld, tScreenViews, vec2(mod(selViewIdX+7.0, 8.0), mod(selViewIdY+7.0, 8.0)), sPixId);\n" + "    fc = fc/(nnc+nncx_r+nncx_l+nncy_u+nncy_d+nncx_lu+nncx_ru+nncy_ld+nncy_rd);\n" + LEIA_mainFinish();
    var CViewSimShader = function() {
        var material = new THREE.ShaderMaterial({
            uniforms: {
                "tScreenViews": {
                    type: "t",
                    value: _this._1passSimRnderTarget
                },
                "renderSize": {
                    type: "v2",
                    value: new THREE.Vector2(simWholeSizeX, simWholeSizeY)
                },
                "selViewIdX": {
                    type: "f",
                    value: _this.indexI
                },
                "selViewIdY": {
                    type: "f",
                    value: _this.indexJ
                },
                "nnc": {
                    type: "f",
                    value: _this.nnc
                },
                "nncx_l": {
                    type: "f",
                    value: _this.nncx_l
                },
                "nncx_r": {
                    type: "f",
                    value: _this.nncx_r
                },
                "nncy_u": {
                    type: "f",
                    value: _this.nncy_u
                },
                "nncy_d": {
                    type: "f",
                    value: _this.nncy_d
                },
                "nncx_lu": {
                    type: "f",
                    value: _this.nncx_lu
                },
                "nncx_ru": {
                    type: "f",
                    value: _this.nncx_ru
                },
                "nncy_rd": {
                    type: "f",
                    value: _this.nncy_rd
                },
                "nncy_ld": {
                    type: "f",
                    value: _this.nncy_ld
                },
                "fader": {
                    type: "f",
                    value: 1
                }
            },
            vertexShader: _SwizzleVertexShaderSrc,
            fragmentShader: _viewSimSrc,
            depthWrite: false
        });
        return {
            material: material
        }
    };
    this.viewSimShader = new CViewSimShader;
    this.resetMaterViewSim = function() {
        var curI = this.indexI;
        var curJ = this.indexJ;
        var cur_leftI = (curI + 7) % 8;
        var cur_leftJ = curJ;
        var cur_rightI = (curI + 1) % 8;
        var cur_rightJ = curJ;
        var cur_upI = curI;
        var cur_upJ = (curJ + 1) % 8;
        var cur_downI = curI;
        var cur_downJ = (curJ + 7) % 8;
        var cur_luI = (curI + 7) % 8;
        var cur_luJ =
            (curJ + 1) % 8;
        var cur_ruI = (curI + 1) % 8;
        var cur_ruJ = (curJ + 1) % 8;
        var cur_rdI = (curI + 1) % 8;
        var cur_rdJ = (curJ + 7) % 8;
        var cur_ldI = (curI + 7) % 8;
        var cur_ldJ = (curJ + 7) % 8;
        var eyePos = new THREE.Vector2(this.interI, this.interJ);
        var curPos = new THREE.Vector2(curI, curJ);
        var cur_leftPos = new THREE.Vector2(cur_leftI, cur_leftJ);
        var cur_rightPos = new THREE.Vector2(cur_rightI, cur_rightJ);
        var cur_upPos = new THREE.Vector2(cur_upI, cur_upJ);
        var cur_downPos = new THREE.Vector2(cur_downI, cur_downJ);
        var cur_luPos = new THREE.Vector2(cur_luI, cur_luJ);
        var cur_ruPos = new THREE.Vector2(cur_ruI, cur_ruJ);
        var cur_rdPos = new THREE.Vector2(cur_rdI, cur_rdJ);
        var cur_ldPos = new THREE.Vector2(cur_ldI, cur_ldJ);
        var disToCur = eyePos.clone().sub(curPos).length();
        var disToCurLeft = eyePos.clone().sub(cur_leftPos).length();
        var disToCurRight = eyePos.clone().sub(cur_rightPos).length();
        var disToCurUp = eyePos.clone().sub(cur_upPos).length();
        var disToCurDown = eyePos.clone().sub(cur_downPos).length();
        var disToCurLU = eyePos.clone().sub(cur_luPos).length();
        var disToCurRU = eyePos.clone().sub(cur_ruPos).length();
        var disToCurRD = eyePos.clone().sub(cur_rdPos).length();
        var disToCurLD = eyePos.clone().sub(cur_ldPos).length();
        if (disToCurLeft > 2.5) disToCurLeft = 8 - disToCurLeft;
        if (disToCurRight > 2.5) disToCurRight = 8 - disToCurRight;
        if (disToCurUp > 2.5) disToCurUp = 8 - disToCurUp;
        if (disToCurDown > 2.5) disToCurDown = 8 - disToCurDown;
        if (disToCurLU > 2.5) disToCurLU = 8 - disToCurLU;
        if (disToCurRU > 2.5) disToCurRU = 8 - disToCurRU;
        if (disToCurRD > 2.5) disToCurRD = 8 - disToCurRD;
        if (disToCurLD > 2.5) disToCurLD = 8 - disToCurLD;
        this.nnc = -.5 * disToCur + 1;
        this.nncx_l = -.5 * disToCurLeft + 1;
        this.nncx_r = -.5 * disToCurRight + 1;
        this.nncy_u = -.5 * disToCurUp + 1;
        this.nncy_d = -.5 * disToCurDown + 1;
        this.nncx_lu = -.5 * disToCurLU + 1;
        this.nncx_ru = -.5 * disToCurRU + 1;
        this.nncy_rd = -.5 * disToCurRD + 1;
        this.nncy_ld = -.5 * disToCurLD + 1;
        this.viewSimShader = new CViewSimShader
    };
    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        switch (keyCode) {
            case 83:
                _this.renderer.nShaderMode++;
                _this.renderer.nShaderMode = _this.renderer.nShaderMode % 5;
                break;
            case 32:
                _this.renderer.bRendering = !_this.renderer.bRendering;
                break
        }
    }
};
var dragControls = function(object, domElement) {
    var _this = this;
    var STATE = {
        NONE: -1,
        ROTATE: 0,
        ZOOM: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_ZOOM_PAN: 4
    };
    this.object = object;
    this.domElement = domElement !== undefined ? domElement : document;
    this.enabled = true;
    this.screen = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };
    this.rotateSpeed = .2;
    this.zoomSpeed = .2;
    this.panSpeed = .6;
    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;
    this.noRoll = false;
    this.staticMoving = false;
    this.dynamicDampingFactor = .3;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.target =
        new THREE.Vector3;
    var EPS = 1E-6;
    var lastPosition = new THREE.Vector3;
    var _state = STATE.NONE,
        _prevState = STATE.NONE,
        _eye = new THREE.Vector3,
        _rotateStart = new THREE.Vector3,
        _rotateEnd = new THREE.Vector3,
        _zoomStart = new THREE.Vector2,
        _zoomEnd = new THREE.Vector2,
        _touchZoomDistanceStart = 0,
        _touchZoomDistanceEnd = 0,
        _panStart = new THREE.Vector2,
        _panEnd = new THREE.Vector2;
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();
    var changeEvent = {
        type: "change"
    };
    var startEvent = {
        type: "start"
    };
    var endEvent = {
        type: "end"
    };
    var getMouseOnScreen = function() {
        var vector = new THREE.Vector2;
        return function(layerX, layerY) {
            vector.set((layerX - _this.screen.left) / _this.screen.width, (layerY - _this.screen.top) / _this.screen.height);
            return vector
        }
    }();
    var getMouseProjectionOnBall = function() {
        var vector = new THREE.Vector3;
        var objectUp = new THREE.Vector3;
        var mouseOnBall = new THREE.Vector3;
        return function(layerX, layerY) {
            mouseOnBall.set((layerX - _this.screen.width * .5 - _this.screen.left) / (_this.screen.width *
                .5), (_this.screen.height * .5 + _this.screen.top - layerY) / (_this.screen.height * .5), 0);
            var length = mouseOnBall.length();
            if (_this.noRoll)
                if (length < Math.SQRT1_2) mouseOnBall.z = Math.sqrt(1 - length * length);
                else mouseOnBall.z = .5 / length;
                else if (length > 1) mouseOnBall.normalize();
            else mouseOnBall.z = Math.sqrt(1 - length * length);
            _eye.copy(_this.object.position).sub(_this.target);
            vector.copy(_this.object.up).setLength(mouseOnBall.y);
            vector.add(objectUp.copy(_this.object.up).cross(_eye).setLength(mouseOnBall.x));
            vector.add(_eye.setLength(mouseOnBall.z));
            return vector
        }
    }();
    this.rotateCamera = function() {
        var axis = new THREE.Vector3,
            quaternion = new THREE.Quaternion;
        return function() {
            var angle = Math.acos(_rotateStart.dot(_rotateEnd) / _rotateStart.length() / _rotateEnd.length());
            if (angle) {
                axis.crossVectors(_rotateStart, _rotateEnd).normalize();
                angle *= _this.rotateSpeed;
                quaternion.setFromAxisAngle(axis, -angle);
                _eye.applyQuaternion(quaternion);
                _this.object.up.applyQuaternion(quaternion);
                _rotateEnd.applyQuaternion(quaternion);
                if (_this.staticMoving) _rotateStart.copy(_rotateEnd);
                else {
                    quaternion.setFromAxisAngle(axis, angle * (_this.dynamicDampingFactor - 1));
                    _rotateStart.applyQuaternion(quaternion)
                }
            }
        }
    }();
    this.zoomCamera = function() {
        if (_state === STATE.TOUCH_ZOOM_PAN) {
            var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            _eye.multiplyScalar(factor)
        } else {
            var factor = 1 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;
            if (factor !== 1 && factor > 0) {
                _eye.multiplyScalar(factor);
                if (_this.staticMoving) _zoomStart.copy(_zoomEnd);
                else _zoomStart.y += (_zoomEnd.y -
                    _zoomStart.y) * this.dynamicDampingFactor
            }
        }
    };
    this.panCamera = function() {
        var mouseChange = new THREE.Vector2,
            objectUp = new THREE.Vector3,
            pan = new THREE.Vector3;
        return function() {
            mouseChange.copy(_panEnd).sub(_panStart);
            if (mouseChange.lengthSq()) {
                mouseChange.multiplyScalar(_eye.length() * _this.panSpeed);
                pan.copy(_eye).cross(_this.object.up).setLength(mouseChange.x);
                pan.add(objectUp.copy(_this.object.up).setLength(mouseChange.y));
                _this.object.position.add(pan);
                _this.target.add(pan);
                if (_this.staticMoving) _panStart.copy(_panEnd);
                else _panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(_this.dynamicDampingFactor))
            }
        }
    }();
    this.checkDistances = function() {
        if (!_this.noZoom || !_this.noPan) {
            if (_eye.lengthSq() > _this.maxDistance * _this.maxDistance) _this.object.position.addVectors(_this.target, _eye.setLength(_this.maxDistance));
            if (_eye.lengthSq() < _this.minDistance * _this.minDistance) _this.object.position.addVectors(_this.target, _eye.setLength(_this.minDistance))
        }
    };
    this.update = function() {
        _eye.subVectors(_this.object.position,
            _this.target);
        if (!_this.noRotate) _this.rotateCamera();
        if (!_this.noZoom) _this.zoomCamera();
        if (!_this.noPan) _this.panCamera();
        _this.object.position.addVectors(_this.target, _eye);
        _this.checkDistances();
        _this.object.lookAt(_this.target);
        if (lastPosition.distanceToSquared(_this.object.position) > EPS) {
            _this.dispatchEvent(changeEvent);
            lastPosition.copy(_this.object.position)
        }
    };
    this.reset = function() {
        _state = STATE.NONE;
        _prevState = STATE.NONE;
        _this.target.copy(_this.target0);
        _this.object.position.copy(_this.position0);
        _this.object.up.copy(_this.up0);
        _eye.subVectors(_this.object.position, _this.target);
        _this.object.lookAt(_this.target);
        _this.dispatchEvent(changeEvent);
        lastPosition.copy(_this.object.position)
    };

    function mousedown(event) {
        if (_this.enabled == false) return;
        var leftBunder = _this.screen.left;
        var rightBunder = _this.screen.left + _this.screen.width;
        var topBunder = _this.screen.top;
        var bottomBunder = _this.screen.top + _this.screen.height;
        if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY <
            bottomBunder) {
            if (_this.enabled === false) return;
            if (_state === STATE.NONE) _state = event.button;
            if (_state === STATE.ROTATE && !_this.noRotate) {
                _rotateStart.copy(getMouseProjectionOnBall(event.layerX, event.layerY));
                _rotateEnd.copy(_rotateStart)
            } else if (_state === STATE.ZOOM && !_this.noZoom) {
                _zoomStart.copy(getMouseOnScreen(event.layerX, event.layerY));
                _zoomEnd.copy(_zoomStart)
            } else if (_state === STATE.PAN && !_this.noPan) {
                _panStart.copy(getMouseOnScreen(event.layerX, event.layerY));
                _panEnd.copy(_panStart)
            }
            document.addEventListener("mousemove",
                mousemove, false);
            document.addEventListener("mouseup", mouseup, false);
            _this.dispatchEvent(startEvent)
        }
    }

    function mousemove(event) {
        if (_this.enabled == false) return;
        var leftBunder = _this.screen.left;
        var rightBunder = _this.screen.left + _this.screen.width;
        var topBunder = _this.screen.top;
        var bottomBunder = _this.screen.top + _this.screen.height;
        if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
            if (_this.enabled === false) return;
            event.preventDefault();
            if (_state ===
                STATE.ROTATE && !_this.noRotate) _rotateEnd.copy(getMouseProjectionOnBall(event.layerX, event.layerY));
            else if (_state === STATE.ZOOM && !_this.noZoom) _zoomEnd.copy(getMouseOnScreen(event.layerX, event.layerY));
            else if (_state === STATE.PAN && !_this.noPan) _panEnd.copy(getMouseOnScreen(event.layerX, event.layerY))
        }
    }

    function mouseup(event) {
        var leftBunder = _this.screen.left;
        var rightBunder = _this.screen.left + _this.screen.width;
        var topBunder = _this.screen.top;
        var bottomBunder = _this.screen.top + _this.screen.height;
        if (event.layerX >
            leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
            _state = STATE.NONE;
            document.removeEventListener("mousemove", mousemove);
            document.removeEventListener("mouseup", mouseup);
            _this.dispatchEvent(endEvent)
        }
        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup)
    }

    function mousewheel(event) {
        var leftBunder = _this.screen.left;
        var rightBunder = _this.screen.left + _this.screen.width;
        var topBunder = _this.screen.top;
        var bottomBunder = _this.screen.top +
            _this.screen.height;
        if (event.layerX > leftBunder && event.layerX < rightBunder && event.layerY > topBunder && event.layerY < bottomBunder) {
            if (_this.enabled === false) return;
            event.preventDefault();
            var delta = 0;
            if (event.wheelDelta) delta = event.wheelDelta / 40;
            else if (event.detail) delta = -event.detail / 3;
            _zoomStart.y += delta * .01;
            _this.dispatchEvent(startEvent);
            _this.dispatchEvent(endEvent)
        }
    }
    this.domElement.addEventListener("mousedown", mousedown, false);
    this.domElement.addEventListener("mousewheel", mousewheel, false);
    this.update()
};
dragControls.prototype = Object.create(THREE.EventDispatcher.prototype);
var AxisPickerMater = function(parameters) {
    THREE.MeshBasicMaterial.call(this);
    this.depthTest = false;
    this.depthWrite = false;
    this.side = THREE.FrontSide;
    this.transparent = true;
    this.setValues(parameters);
    this.oldColor = this.color.clone();
    this.oldOpacity = this.opacity;
    this.highlight = function(highlighted) {
        if (highlighted) {
            this.color.setRGB(1, 1, 0);
            this.opacity = 1
        } else {
            this.color.copy(this.oldColor);
            this.opacity = this.oldOpacity
        }
    }
};
AxisPickerMater.prototype = Object.create(THREE.MeshBasicMaterial.prototype);
var AxisPickerLineMater = function(parameters) {
    THREE.LineBasicMaterial.call(this);
    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;
    this.linewidth = 1;
    this.setValues(parameters);
    this.oldColor = this.color.clone();
    this.oldOpacity = this.opacity;
    this.highlight = function(highlighted) {
        if (highlighted) {
            this.color.setRGB(1, 1, 0);
            this.opacity = 1
        } else {
            this.color.copy(this.oldColor);
            this.opacity = this.oldOpacity
        }
    }
};
AxisPickerLineMater.prototype = Object.create(THREE.LineBasicMaterial.prototype);
var AxisPickerTransForm = function(pickerSize) {
    var _this = this;
    var bShowShell = false;
    var bShowActPlane = false;
    this.init = function() {
        THREE.Object3D.call(this);
        this.handles = new THREE.Object3D;
        this.pickers = new THREE.Object3D;
        this.planes = new THREE.Object3D;
        this.add(this.handles);
        this.add(this.pickers);
        this.add(this.planes);
        var geoPlane = new THREE.PlaneGeometry(20 * pickerSize, 20 * pickerSize, 1, 1);
        var matPlane = new THREE.MeshBasicMaterial({
            wireframe: true
        });
        matPlane.side = THREE.DoubleSide;
        var planes = {
            "XY": new THREE.Mesh(geoPlane,
                matPlane),
            "YZ": new THREE.Mesh(geoPlane, matPlane),
            "XZ": new THREE.Mesh(geoPlane, matPlane),
            "XYZE": new THREE.Mesh(geoPlane, matPlane)
        };
        this.actPlane = planes["XY"];
        planes["YZ"].rotation.set(0, Math.PI / 2, 0);
        planes["XZ"].rotation.set(-Math.PI / 2, 0, 0);
        for (var i in planes) {
            planes[i].name = i;
            planes[i].leiaType = 1;
            this.planes.add(planes[i]);
            this.planes[i] = planes[i];
            planes[i].visible = false
        }
        var setupAxisPickers = function(pickersMap, parent) {
            for (var name in pickersMap)
                for (i = pickersMap[name].length; i--;) {
                    var object = pickersMap[name][i][0];
                    var position = pickersMap[name][i][1];
                    var rotation = pickersMap[name][i][2];
                    object.name = name;
                    object.leiaType = 1;
                    if (position) object.position.set(position[0], position[1], position[2]);
                    if (rotation) object.rotation.set(rotation[0], rotation[1], rotation[2]);
                    parent.add(object)
                }
        };
        setupAxisPickers(this.handleAxisPickers, this.handles);
        setupAxisPickers(this.pickerAxisPickers, this.pickers);
        this.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                child.updateMatrix();
                var tempGeometry = new THREE.Geometry;
                tempGeometry.merge(child.geometry,
                    child.matrix);
                child.geometry = tempGeometry;
                child.position.set(0, 0, 0);
                child.rotation.set(0, 0, 0);
                child.scale.set(1, 1, 1)
            }
        })
    };
    this.show = function(oneDir) {
        this.traverse(function(child) {
            if (child.parent == _this.pickers) child.visible = false;
            if (child.parent == _this.planes) child.visible = false;
            if (child.parent == _this.handles) child.visible = true
        });
        this.actPlane.visible = false
    };
    this.hide = function() {
        this.traverse(function(child) {
            child.visible = false
        })
    };
    this.highlight = function(axis) {
        this.traverse(function(child) {
            if (child.material &&
                child.material.highlight)
                if (child.name == axis) child.material.highlight(true);
                else child.material.highlight(false)
        })
    };
    this.update = function(rotation) {
        this.traverse(function(child) {
            child.quaternion.setFromEuler(rotation)
        })
    }
};
AxisPickerTransForm.prototype = Object.create(THREE.Object3D.prototype);
var AxisPickerTranslate = function(pickerSize) {
    AxisPickerTransForm.call(this, pickerSize);
    var geoArrow = new THREE.Geometry;
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0, .05 * pickerSize, .2 * pickerSize, 12, 1, false));
    mesh.position.y = .5 * pickerSize;
    mesh.matrix.compose(mesh.position, mesh.quaternion, mesh.scale);
    geoArrow.merge(mesh.geometry, mesh.matrix);
    var lineXGeometry = new THREE.Geometry;
    lineXGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1 * pickerSize, 0, 0));
    var lineYGeometry = new THREE.Geometry;
    lineYGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1 * pickerSize, 0));
    var lineZGeometry = new THREE.Geometry;
    lineZGeometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1 * pickerSize));
    this.handleAxisPickers = {
        X: [
            [new THREE.Mesh(geoArrow, new AxisPickerMater({
                    color: 16711680
                })), [.5 * pickerSize, 0, 0],
                [0, 0, -Math.PI / 2]
            ],
            [new THREE.Line(lineXGeometry, new AxisPickerLineMater({
                color: 16711680
            }))]
        ],
        Y: [
            [new THREE.Mesh(geoArrow, new AxisPickerMater({
                color: 65280
            })), [0, .5 * pickerSize,
                0
            ]],
            [new THREE.Line(lineYGeometry, new AxisPickerLineMater({
                color: 65280
            }))]
        ],
        Z: [
            [new THREE.Mesh(geoArrow, new AxisPickerMater({
                    color: 255
                })), [0, 0, .5 * pickerSize],
                [Math.PI / 2, 0, 0]
            ],
            [new THREE.Line(lineZGeometry, new AxisPickerLineMater({
                color: 255
            }))]
        ]
    };
    this.pickerAxisPickers = {
        X: [
            [new THREE.Mesh(new THREE.CylinderGeometry(.2 * pickerSize, 0, 1 * pickerSize, 4, 1, false), new AxisPickerMater({
                    color: 16711680,
                    opacity: .25
                })), [.6 * pickerSize, 0, 0],
                [0, 0, -Math.PI / 2]
            ]
        ],
        Y: [
            [new THREE.Mesh(new THREE.CylinderGeometry(.2 * pickerSize,
                0, 1 * pickerSize, 4, 1, false), new AxisPickerMater({
                color: 65280,
                opacity: .25
            })), [0, .6 * pickerSize, 0]]
        ],
        Z: [
            [new THREE.Mesh(new THREE.CylinderGeometry(.2 * pickerSize, 0, 1 * pickerSize, 4, 1, false), new AxisPickerMater({
                    color: 255,
                    opacity: .25
                })), [0, 0, .6 * pickerSize],
                [Math.PI / 2, 0, 0]
            ]
        ]
    };
    this.setActPlane = function(axis) {
        if (axis == "X") this.actPlane = this.planes["XY"];
        if (axis == "Y") this.actPlane = this.planes["XY"];
        if (axis == "Z") this.actPlane = this.planes["XZ"]
    };
    this.init()
};
AxisPickerTranslate.prototype = Object.create(AxisPickerTransForm.prototype);
var pickControls = function(camera, domElement, pickerSize) {
    THREE.Object3D.call(this);
    domElement = domElement !== undefined ? domElement : document;
    this.axisPickers = {};
    this.axisPickers[0] = new AxisPickerTranslate(pickerSize);
    this.add(this.axisPickers[0]);
    var _this = this;
    this.object = undefined;
    var _dragging = false;
    this.axis = null;
    this.screen = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };
    this.view64fov = undefined;
    this.spanSphereMode = undefined;
    var ray = new THREE.Raycaster;
    var projector = new THREE.Projector;
    var pointerVec = new THREE.Vector3;
    var worldPosition = new THREE.Vector3;
    var camPos = new THREE.Vector3;
    var lastPos = new THREE.Vector3;
    var parentRMat = new THREE.Matrix4;
    var curPos = new THREE.Vector3;
    var startPos = new THREE.Vector3;
    var tempMatrix = new THREE.Matrix4;
    var tempMatrix2 = new THREE.Matrix4;
    var worldRotationMatrix = new THREE.Matrix4;
    domElement.addEventListener("mousemove", onMouseHover, false);
    domElement.addEventListener("mousedown", onMouseDown, false);
    domElement.addEventListener("mousemove", onMouseMove, false);
    domElement.addEventListener("mousewheel",
        onMouseWheel, false);
    domElement.addEventListener("mouseup", onMouseUp, false);
    this.attach = function(obj, oneDir) {
        _this.object = obj;
        _this.update();
        this.axisPickers[0].show(oneDir)
    };
    this.update = function() {
        if (_this.object == undefined) return;
        worldPosition.setFromMatrixPosition(_this.object.matrix);
        camPos.setFromMatrixPosition(camera.matrix);
        _this.position.copy(worldPosition);
        _this.axisPickers[0].highlight(_this.axis)
    };

    function onMouseHover(event) {
        if (_this.object == undefined || _dragging == true) return;
        event.preventDefault();
        var pointer = event;
        var intersect = intersectObjs(pointer, _this.axisPickers[0].pickers.children);
        if (intersect) {
            _this.axis = intersect.object.name;
            _this.update()
        } else if (_this.axis != null) {
            _this.axis = null;
            _this.update()
        }
    }

    function onMouseDown(event) {
        if (_this.object == undefined || _dragging == true) return;
        var pointer = event;
        if (pointer.button == 0 || pointer.button == undefined) {
            var intersect = intersectObjs(pointer, _this.axisPickers[0].pickers.children);
            if (intersect) {
                _this.axis = intersect.object.name;
                _this.update();
                _this.axisPickers[0].setActPlane(_this.axis);
                var planeIntersect = intersectObjs(pointer, [_this.axisPickers[0].actPlane]);
                if (planeIntersect) {
                    lastPos.copy(_this.object.position);
                    worldRotationMatrix.extractRotation(_this.object.matrixWorld.multiply(tempMatrix2.getInverse(_this.object.matrix)));
                    startPos.copy(planeIntersect.point)
                }
            }
            _dragging = true
        } else if (pointer.button == 2 && _this.axis !== null && _this.object.name == "eyeCenter") {
            if (_this.object == undefined || _dragging == true) return;
            _this.spanSphereMode = !_this.spanSphereMode
        } else {
            _this.axisPickers[0].traverse(function(child) {
                child.visible = !child.visible;
                if (child.parent == _this.axisPickers[0].pickers) child.visible = false;
                if (child.parent == _this.axisPickers[0].planes) child.visible = false
            });
            _this.object.visible = !_this.object.visible;
            if (_this.object.name == "tarPlane") console.log("tarPlane distance:")
        }
    }

    function onMouseMove(event) {
        if (_this.object == undefined || _this.axis == null || _dragging == false) return;
        event.preventDefault();
        var pointer = event;
        var planeIntersect = intersectObjs(pointer, [_this.axisPickers[0].actPlane]);
        if (planeIntersect) {
            curPos.copy(planeIntersect.point);
            curPos.sub(startPos);
            curPos.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
            if (_this.object.name == "UpPlane" || _this.object.name == "DownPlane") {
                curPos.x = 0;
                curPos.y = 0;
                if (_this.axis.search("Z") == -1) curPos.z = 0
            } else {
                if (_this.axis.search("X") == -1) curPos.x = 0;
                if (_this.axis.search("Y") == -1) curPos.y = 0;
                if (_this.axis.search("Z") == -1) curPos.z = 0
            }
            _this.object.position.copy(lastPos);
            _this.object.position.add(curPos)
        }
        _this.update()
    }

    function onMouseUp(event) {
        _dragging = false;
        onMouseHover(event)
    }

    function onMouseWheel(event) {
        if (_this.object ==
            undefined || _this.axis == null || _dragging == true) return;
        event.preventDefault();
        var delta = 0;
        if (event.wheelDelta) delta = event.wheelDelta / 40;
        else if (event.detail) delta = -event.detail / 3;
        if (_this.object.name == "eyeCenter") _this.view64fov += delta * .1;
        if (_this.object.name == "tarPlane") {
            _this.object.scale.x += delta * .003;
            _this.object.scale.y += delta * .003;
            _this.object.scale.z += delta * .003
        }
    }
    var getMouseOnScreen = function() {
        var vector = new THREE.Vector2;
        return function(layerX, layerY) {
            vector.set((layerX - _this.screen.left) / _this.screen.width, (layerY - _this.screen.top) / _this.screen.height);
            return vector
        }
    }();

    function intersectObjs(pointer, objs) {
        var _MousePos = new THREE.Vector2;
        _MousePos.copy(getMouseOnScreen(pointer.layerX, pointer.layerY));
        pointerVec.set(_MousePos.x * 2 - 1, -2 * _MousePos.y + 1, .5);
        projector.unprojectVector(pointerVec, camera);
        ray.set(camPos, pointerVec.sub(camPos).normalize());
        var intersections = ray.intersectObjects(objs, true);
        return intersections[0] ? intersections[0] : false
    }
};
pickControls.prototype = Object.create(THREE.Object3D.prototype);
var SelectorMater = function(parameters) {
    THREE.MeshPhongMaterial.call(this);
    this.setValues(parameters);
    this.oldColor = this.color.clone();
    this.oldOpacity = this.opacity;
    this.highlight = function(highlighted, selected) {
        if (highlighted || selected) {
            this.color.setRGB(1, 1, 0);
            this.opacity = 1
        } else {
            this.color.copy(this.oldColor);
            this.opacity = this.oldOpacity
        }
    }
};
SelectorMater.prototype = Object.create(THREE.MeshBasicMaterial.prototype);
var SelectorObj = function(objSize) {
    THREE.Object3D.call(this);
    this.objs = new THREE.Object3D;
    this.add(this.objs);
    var matObj = new SelectorMater({
        color: 37779,
        opacity: 1,
        wireframe: false
    });
    var geoObj = new THREE.CylinderGeometry(0, objSize / 40, objSize / 20, 8);
    geoObj.applyMatrix((new THREE.Matrix4).makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0)));
    var obj_0 = new THREE.Mesh(geoObj, matObj);
    obj_0.name = "selectable_obj";
    obj_0.leiaType = 1;
    this.objs.add(obj_0);
    this.objs.leiaType = 1;
    this.highlight = function(bHighlight,
        bSelected) {
        this.traverse(function(child) {
            if (child.material && child.material.highlight) child.material.highlight(bHighlight, bSelected)
        })
    }
};
SelectorObj.prototype = Object.create(THREE.Object3D.prototype);
var selectControls = function(camera, domElement, objSize, indexI, indexJ) {
    THREE.Object3D.call(this);
    domElement = domElement !== undefined ? domElement : document;
    this.screen = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };
    this.bHighlight = false;
    this.bSelected = false;
    this.indexI = indexI;
    this.indexJ = indexJ;
    var _this = this;
    var camPos = new THREE.Vector3;
    var ray = new THREE.Raycaster;
    var projector = new THREE.Projector;
    var pointerVec = new THREE.Vector3;
    domElement.addEventListener("mousemove", onMouseHover, false);
    this.selectedOne = null;
    this.selectObj =
        new SelectorObj(objSize);
    this.add(this.selectObj);
    this.update = function() {
        camPos.setFromMatrixPosition(camera.matrix);
        _this.selectObj.highlight(this.bHighlight, this.bSelected)
    };

    function onMouseHover(event) {
        event.preventDefault();
        var pointer = event;
        var intersect = intersectObjs(pointer, _this.selectObj.objs.children);
        if (intersect) {
            _this.selectedOne = intersect.object.name;
            _this.bHighlight = true;
            _this.update()
        } else if (_this.selectedOne != null) {
            _this.selectedOne = null;
            _this.bHighlight = false;
            _this.update()
        }
    }
    var getMouseOnScreen =
        function() {
            var vector = new THREE.Vector2;
            return function(layerX, layerY) {
                vector.set((layerX - _this.screen.left) / _this.screen.width, (layerY - _this.screen.top) / _this.screen.height);
                return vector
            }
    }();

    function intersectObjs(pointer, objs) {
        var _MousePos = new THREE.Vector2;
        _MousePos.copy(getMouseOnScreen(pointer.layerX, pointer.layerY));
        pointerVec.set(_MousePos.x * 2 - 1, -2 * _MousePos.y + 1, .5);
        projector.unprojectVector(pointerVec, camera);
        ray.set(camPos, pointerVec.sub(camPos).normalize());
        var intersections = ray.intersectObjects(objs,
            true);
        return intersections[0] ? intersections[0] : false
    }
};
selectControls.prototype = Object.create(THREE.Object3D.prototype);
var trackPadControls = function(camera, domElement, obj) {
    this.object = obj;
    domElement = domElement !== undefined ? domElement : document;
    this.screen = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };
    var _this = this;
    var camPos = new THREE.Vector3;
    var ray = new THREE.Ray;
    var projector = new THREE.Projector;
    var pointerVec = new THREE.Vector3;
    var worldPosition = new THREE.Vector3;
    var worldRotationMatrix = new THREE.Matrix4;
    var tempMatrix = new THREE.Matrix4;
    var tempMatrix2 = new THREE.Matrix4;
    var tempMatrix3 = new THREE.Matrix4;
    this.normal = new THREE.Vector3(0,
        0, 1);
    this.camPlane = new THREE.Plane(this.normal);
    var halfrange = Math.abs(this.object.geometry.vertices[0].x);
    var indicatorSize = halfrange / 60;
    var geoIndi = new THREE.SphereGeometry(indicatorSize, 8, 8);
    var matIndi = new THREE.MeshBasicMaterial({
        color: 16776960,
        transparent: false
    });
    this.Indicator = new THREE.Mesh(geoIndi, matIndi);
    this.Indicator.visible = false;
    this.Indicator.name = "indiBall";
    this.Indicator.leiaType = 1;
    this.indiPos = new THREE.Vector3;
    this.touchPos = new THREE.Vector2(2 / 7, 5 / 7);
    this.enable = true;
    var dragging =
        false;
    this.update = function() {
        camPos.setFromMatrixPosition(camera.matrixWorld);
        if (this.object == undefined) {
            console.log("this.object == undefined !");
            return
        }
        var normal = new THREE.Vector3(0, 0, 1);
        worldRotationMatrix.extractRotation(this.object.matrixWorld);
        normal.applyMatrix4(worldRotationMatrix);
        normal.normalize();
        var curPos = new THREE.Vector3;
        curPos.copy(this.object.position);
        curPos.applyMatrix4(this.object.matrixWorld);
        worldPosition.copy(curPos);
        this.camPlane.setFromNormalAndCoplanarPoint(normal, worldPosition);
        this.Indicator.scale.x = this.object.scale.x;
        this.Indicator.scale.y = this.object.scale.y;
        this.Indicator.scale.z = this.object.scale.z;
        if (this.indiPos == undefined) return;
        this.Indicator.position.x = this.indiPos.x;
        this.Indicator.position.y = this.indiPos.y;
        this.Indicator.position.z = this.indiPos.z
    };
    domElement.addEventListener("mousedown", onMouseDown, false);
    domElement.addEventListener("mousemove", onMouseMove, false);
    domElement.addEventListener("mouseup", onMouseUp, false);

    function onMouseDown(event) {
        var pointer = event;
        if (!_this.enable || !intersectObjs(pointer, _this.camPlane)) {
            _this.update();
            return
        }
        if (pointer.button == 0 || pointer.button == undefined) {
            dragging = true;
            var intersect = intersectObjs(pointer, _this.camPlane);
            if (intersect) {
                _this.touchPos.x = intersect.x;
                _this.touchPos.y = intersect.y;
                _this.update()
            } else _this.update()
        }
    }

    function onMouseMove(event) {
        if (!_this.enable || !dragging) return;
        event.preventDefault();
        var pointer = event;
        var intersect = intersectObjs(pointer, _this.camPlane);
        if (intersect) {
            _this.touchPos.x = intersect.x;
            _this.touchPos.y = intersect.y;
            _this.update()
        } else _this.update()
    }

    function onMouseUp(event) {
        dragging = false;
        _this.update()
    }
    var getMouseOnScreen = function() {
        var vector = new THREE.Vector2;
        return function(layerX, layerY) {
            vector.set((layerX - _this.screen.left) / _this.screen.width, (layerY - _this.screen.top) / _this.screen.height);
            return vector
        }
    }();

    function intersectObjs(pointer, objs) {
        if (_this.object == undefined) {
            console.log("_this.object == undefined !");
            return
        }
        var _MousePos = new THREE.Vector2;
        _MousePos.copy(getMouseOnScreen(pointer.layerX,
            pointer.layerY));
        pointerVec.set(_MousePos.x * 2 - 1, -2 * _MousePos.y + 1, .5);
        projector.unprojectVector(pointerVec, camera);
        ray.set(camPos, pointerVec.sub(camPos).normalize());
        _this.indiPos = ray.intersectPlane(objs);
        if (_this.indiPos == undefined) return false;
        var intersection = new THREE.Vector3;
        intersection.copy(_this.indiPos);
        intersection.applyMatrix4(tempMatrix.getInverse(_this.object.matrixWorld));
        var halfrange = Math.abs(_this.object.geometry.vertices[0].x);
        var cordi = new THREE.Vector2;
        cordi.x = (intersection.x + halfrange) /
            (2 * halfrange);
        cordi.y = (intersection.y + halfrange) / (2 * halfrange);
        if (cordi.x > 0 && cordi.x < 1 && cordi.y > 0 && cordi.y < 1) {
            _this.Indicator.visible = true;
            return cordi
        } else {
            _this.Indicator.visible = false;
            return false
        }
    }
};
(function() {
    var EmulatorCtrl = {};
    var nNumOfViewsX = 8;
    var nNumOfViewsY = 8;
    EmulatorCtrl.ShiftX = 0;
    EmulatorCtrl.ShiftY = 0;
    EmulatorCtrl.emulator = {
        state: "OFF"
    };
    EmulatorCtrl.cookieExpireDate;
    addEventListener("message", function(event) {
        var msg = JSON.parse(event.data);
        switch (msg.type) {
            case "EmulatorState":
                console.log("APP Emulator State: ", msg.State);
                EmulatorCtrl.emulator.state = msg.State;
                break;
            case "sensor":
                (function() {
                    var yaw = document.getElementById("yaw");
                    if (yaw) yaw.innerText = msg.data.yaw;
                    var pitch = document.getElementById("pitch");
                    if (pitch) pitch.innerText = msg.data.pitch;
                    var roll = document.getElementById("roll");
                    if (roll) roll.innerText = msg.data.roll
                })();
                break;
            default:
        }
    }, false);

    function postShiftMessage() {
        if (window._messageFlag == "MessageToIDE") {
            var message = JSON.stringify({
                type: "shiftXY",
                data: {
                    x: EmulatorCtrl.ShiftX,
                    y: EmulatorCtrl.ShiftY
                }
            });
            window.top.postMessage(message, "*")
        } else if (window._messageFlag == "MessageToEmulator") console.log("error:postShiftMessage should not go here!");
        else console.log("window._messageFlag error!")
    }

    function queryEmulatorStatus() {
        console.log("Query Emulator Status");
        if (window._messageFlag == "MessageToEmulator") EmulatorCtrl.emulator.state = "ON";
        else {
            var msg = {
                type: "QueryEmulator",
                body: "status"
            };
            top.postMessage(JSON.stringify(msg), "*")
        }
    }

    function InitLC() {
        var time = Date.now();
        var expireDate = new Date(time + 10 * 1E3 * 3600 * 24);
        EmulatorCtrl.cookieExpireDate = expireDate.toGMTString();
        var cookieInfo = document.cookie.split(";");
        for (var i = 0; i < cookieInfo.length; i++) {
            var c = cookieInfo[i].trim();
            if (c.indexOf("LEIA_shiftX=") == 0) EmulatorCtrl.ShiftX = parseInt(c.substring(12, c.length));
            if (c.indexOf("LEIA_shiftY=") ==
                0) EmulatorCtrl.ShiftY = parseInt(c.substring(12, c.length))
        }
        postShiftMessage();
        document.body.style.marginTop = EmulatorCtrl.ShiftY + "px";
        document.body.style.marginLeft = EmulatorCtrl.ShiftX + "px";
        console.log(document.body.style.marginTop + " " + document.body.style.marginLeft);
        queryEmulatorStatus()
    }

    function addGyroMonitor() {
        console.log("Setup GyroMonitor");
        window.Gyro = {
            yaw: 0,
            pitch: 0,
            roll: 0
        };
        (function queryYawPitchRoll() {
            if (EmulatorCtrl.emulator.state === "ON") {
                var xmlhttp = new XMLHttpRequest;
                xmlhttp.onreadystatechange =
                    function() {
                        if (this.readyState == this.DONE)
                            if (this.status == 200 && this.response != null) {
                                var params = JSON.parse(this.responseText);
                                if (params.yaw) window.Gyro["yaw"] = params.yaw;
                                if (params.pitch) window.Gyro["pitch"] = params.pitch;
                                if (params.roll) window.Gyro["roll"] = params.roll;
                                return
                            } else console.log("something wrong: emulator no response")
                };
                xmlhttp.open("GET", "http://127.0.0.1:8887/bozpity/readgyrov2", true);
                xmlhttp.send()
            }
            setTimeout(function() {
                queryYawPitchRoll()
            }, 200)
        })()
    }
    if (window._messageFlag == "MessageToIDE") addEventListener("load",
        function(event) {
            console.log("init app client.");
            console.log("setup key map i, j, k, l ");
            document.onkeydown = function(event) {
                if (event && event.keyCode == 73) {
                    EmulatorCtrl.ShiftY = EmulatorCtrl.ShiftY - 1;
                    if (EmulatorCtrl.ShiftY < 0) EmulatorCtrl.ShiftY = nNumOfViewsY - 1;
                    var str = "LEIA_shiftY=" + EmulatorCtrl.ShiftY.toString() + ";path=/;" + "session=false;" + "expires=" + EmulatorCtrl.cookieExpireDate + ";";
                    document.cookie = str;
                    document.body.style.marginTop = EmulatorCtrl.ShiftY + "px";
                    postShiftMessage()
                } else if (event && event.keyCode ==
                    74) {
                    EmulatorCtrl.ShiftX = EmulatorCtrl.ShiftX - 1;
                    if (EmulatorCtrl.ShiftX < 0) EmulatorCtrl.ShiftX = nNumOfViewsX - 1;
                    var str = "LEIA_shiftX=" + EmulatorCtrl.ShiftX.toString() + ";path=/;" + "session=false;" + "expires=" + EmulatorCtrl.cookieExpireDate + ";";
                    document.cookie = str;
                    document.body.style.marginLeft = EmulatorCtrl.ShiftX + "px";
                    postShiftMessage()
                } else if (event && event.keyCode == 75) {
                    EmulatorCtrl.ShiftY = EmulatorCtrl.ShiftY + 1;
                    if (EmulatorCtrl.ShiftY >= nNumOfViewsY) EmulatorCtrl.ShiftY = 0;
                    var str = "LEIA_shiftY=" + EmulatorCtrl.ShiftY.toString() +
                        ";path=/;" + "session=false;" + "expires=" + EmulatorCtrl.cookieExpireDate + ";";
                    document.cookie = str;
                    document.body.style.marginTop = EmulatorCtrl.ShiftY + "px";
                    postShiftMessage()
                } else if (event && event.keyCode == 76) {
                    EmulatorCtrl.ShiftX = EmulatorCtrl.ShiftX + 1;
                    if (EmulatorCtrl.ShiftX >= nNumOfViewsX) EmulatorCtrl.ShiftX = 0;
                    var str = "LEIA_shiftX=" + EmulatorCtrl.ShiftX.toString() + ";path=/;" + "session=false;" + "expires=" + EmulatorCtrl.cookieExpireDate + ";";
                    document.cookie = str;
                    document.body.style.marginLeft = EmulatorCtrl.ShiftX + "px";
                    postShiftMessage()
                }
            };
            InitLC();
            addGyroMonitor()
        }, false);
    else if (window._messageFlag == "MessageToEmulator") addEventListener("load", function(event) {
        document.body.style.marginTop = 0 + "px";
        document.body.style.marginLeft = 0 + "px";
        addGyroMonitor()
    }, false);
    else console.log("window._messageFlag error!");
    window.EmulatorCtrl = EmulatorCtrl
})();
