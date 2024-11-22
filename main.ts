import { error } from 'console';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class ThreeDViewerPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		this.registerExtensions(['glb', 'gltf'], '3d-model');
		console.log('ThreeDViewerPlugin: onload started');
		await this.loadSettings();
		console.log('ThreeDViewerPlugin: Settings loaded:', this.settings);

		this.registerMarkdownPostProcessor((element, context) => {
			console.log('ThreeDViewerPlugin: Processing Markdown element', element);
			const links = element.querySelectorAll('a');
			console.log('Found links:', links);

			links.forEach(link => {
				console.log('ThreeDViewerPlugin: Found link:', link);
				const href = link.getAttribute('href');
				if(href){
					const file = this.app.metadataCache.getFirstLinkpathDest(href, '');
					if (file && (file.extension === 'glb' || file.extension === 'gltf')) {
						const viewerContainer = document.createElement('div');
						viewerContainer.className = 'three-d-viewer-container';
						viewerContainer.style.width = '500px';
						viewerContainer.style.height = '500px';

						link.replaceWith(viewerContainer);

						requestAnimationFrame(() => {
 
							this.initThreeDViewer(viewerContainer, file);
						});
					}
				}
				
			});
		});
		
	}

	initThreeDViewer(container: HTMLElement, file: any) {
		// Get file path
		const vaultPath = this.app.vault.adapter.getResourcePath(file.path);
		console.log('Vault Path:', vaultPath);
		
		// Three.js comp
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xffffff); // Set background color

		if (container.offsetWidth === 0 || container.offsetHeight === 0) {
			container.style.width = '500px'; // or '100%' if parent has defined width
			container.style.height = '500px'; // or any height you prefer
		}
		console.log('Container dimensions after setting:', container.offsetWidth, container.offsetHeight);

		const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		console.log('Container dimensions:', container.offsetWidth, container.offsetHeight);

		renderer.setSize(container.offsetWidth, container.offsetHeight);
		container.appendChild(renderer.domElement);

		// Camera controls
		const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();

		camera.position.set(0, 2, 3);
		camera.lookAt(0, 2, 0);

		//lighting
		const light = new THREE.HemisphereLight(0xffffff, 1);
		scene.add(light);
		

		// Animation loop
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}
		animate();
	
		

		// Load 3D model
		const loader = new GLTFLoader();
		loader.load(
			vaultPath,
			(gltf) => {
				console.log('3D Model loaded:', gltf);
				scene.add(gltf.scene);
			},
			(xhr) => {
				console.log('Loading: ${(xhr.loaded / xhr.total * 100)}%');
			},
			(error) => {
				console.error('Error loading 3D file:', error);
			}
		);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}