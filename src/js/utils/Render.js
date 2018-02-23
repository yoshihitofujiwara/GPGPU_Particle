export default class Render {
	/**
	 * constructor
	 * @param  {jQuery} $container canvas container
	 * @param  {Object} oprions
	 */
	constructor ($container, options) {
		this.$container = $container;
		this.width = this.$container.width();
		this.height = this.$container.height();

		this.options = $.extend(true, {
      is3D        : false,
      isController: false,
      isAxis      : false,
      isGui       : true
		}, options);

		// event: [start, stop, resize, update]
		this.event = new AMP.Events();

		this.isDebug = -1 < location.href.indexOf('http://localhost');

		// stats
		this.stats = new Stats();
		this.$container[0].appendChild(this.stats.dom);

		if(this.isDebug){
			$(this.stats.domElement).css({display: 'block'});
		} else {
			$(this.stats.domElement).css({display: 'none'});
		}


		// gui
		if(this.options.isGui){
			this.gui = new dat.GUI();

			if(!AMP.hasHash("guiopen")){
				this.gui.close();
			}
			this.gui.params = {};

			this.gui.params.stats = this.isDebug;

      this.gui.add(this.gui.params, 'stats').name('FPS Metor').onChange(() => {
        if(this.gui.params.stats){
          $(this.stats.domElement).css('display', 'block');
        } else {
          $(this.stats.domElement).css('display', 'none');
        }
      });

			if(this.isDebug){
				this.gui.open();
			}
		}

		this._animationId = null;

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(0x000000);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);

		this.scene = new THREE.Scene();

		// Camera: 2D or 3D
		if(this.options.is3D){
			this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 10000);
			this.camera.position.set(0, 0, 10);
			this.camera.aspect = this.width / this.height;

			if(this.options.isController){
				this.controller = new THREE.OrbitControls(this.camera, this.renderer.domElement);
				this.controller.autoRotate = false;
				this.controller.autoRotateSpeed = 5.0;
			}

		} else {
			this.camera = new THREE.Camera();
		}

		// AxisHelper
		if(this.options.isAxis){
			this.axis = new THREE.AxisHelper(1000);
			this.scene.add(this.axis);
		}

		this.$container[0].appendChild(this.renderer.domElement);

		// @resize
		$(window).resize(this.resize.bind(this));
	}


	/**
	 * start
	 */
	start(){
		cancelAnimationFrame(this._animationId);
		this.event.trigger('start', this);
		this.update();
	}


	/**
	 * stop
	 */
	stop(){
		cancelAnimationFrame(this._animationId);
		this.event.trigger('stop', this);
	}


	/**
	 * update
	 */
	update(){
		this._animationId = requestAnimationFrame(this.update.bind(this));

		this.event.trigger('update', this);

		if(this.controller){
			this.controller.update();
		}

		this.render();

		if(this.gui.params.stats){
			this.stats.update();
		}
	}


	/**
	 * render description
	 */
	render(){
		this.renderer.render(this.scene, this.camera);
	}


	/**
	 * resize
	 */
	resize(){
		this.width = this.$container.width();
		this.height = this.$container.height();

		this.renderer.setSize(this.width, this.height);

		if(this.options.is3D){
			this.camera.aspect = this.width / this.height;
	  	this.camera.updateProjectionMatrix();

		} else {
			// ...
		}
		this.event.trigger('resize', this);
	}
}
