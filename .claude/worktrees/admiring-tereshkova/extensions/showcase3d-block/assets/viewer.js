/**
 * Showcase3D Viewer
 * Premium 3D product visualization for Shopify storefronts
 *
 * This script initializes Three.js viewers for all Showcase3D blocks on the page.
 * It lazy-loads the 3D engine for optimal performance.
 */

;(function () {
  "use strict"

  // Configuration
  const APP_PROXY_URL = "/apps/showcase3d/api/proxy/viewer"
  const THREE_CDN = "https://unpkg.com/three@0.170.0/build/three.module.min.js"
  const DRACO_CDN =
    "https://unpkg.com/three@0.170.0/examples/jsm/loaders/DRACOLoader.js"
  const GLTF_CDN =
    "https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js"
  const ORBIT_CDN =
    "https://unpkg.com/three@0.170.0/examples/jsm/controls/OrbitControls.js"

  // Track loaded modules
  let THREE = null
  let GLTFLoader = null
  let DRACOLoader = null
  let OrbitControls = null

  /**
   * Dynamically import ES modules
   */
  async function loadModules() {
    if (THREE) return

    try {
      THREE = await import(THREE_CDN)

      const [gltfModule, dracoModule, orbitModule] = await Promise.all([
        import(GLTF_CDN),
        import(DRACO_CDN),
        import(ORBIT_CDN),
      ])

      GLTFLoader = gltfModule.GLTFLoader
      DRACOLoader = dracoModule.DRACOLoader
      OrbitControls = orbitModule.OrbitControls

      console.log("[Showcase3D] Modules loaded successfully")
    } catch (error) {
      console.error("[Showcase3D] Failed to load modules:", error)
      throw error
    }
  }

  /**
   * Initialize a single viewer
   */
  async function initViewer(container) {
    const viewerElement = container.querySelector(".showcase3d-viewer")
    const loadingElement = container.querySelector(".showcase3d-loading")
    const canvas = container.querySelector(".showcase3d-canvas")

    // Get configuration from data attributes
    const config = {
      modelId: container.dataset.modelId,
      productId: container.dataset.productId,
      shop: container.dataset.shop,
      autoRotate: container.dataset.autoRotate === "true",
      environment: container.dataset.environment || "studio",
    }

    try {
      // Fetch model data from API
      const params = new URLSearchParams({
        shop: config.shop,
        ...(config.modelId && { modelId: config.modelId }),
        ...(config.productId && { productId: config.productId }),
      })

      const response = await fetch(`${APP_PROXY_URL}?${params}`)

      if (!response.ok) {
        throw new Error("Model not found")
      }

      const modelData = await response.json()

      // Load Three.js modules
      await loadModules()

      // Create scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x09090a)

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
      )
      camera.position.set(0, 0, 5)

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      })
      renderer.setSize(canvas.clientWidth, canvas.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = modelData.exposure || 1
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
      scene.add(ambientLight)

      const spotLight = new THREE.SpotLight(0xffffff, 1)
      spotLight.position.set(10, 10, 10)
      spotLight.castShadow = true
      spotLight.shadow.mapSize.width = 2048
      spotLight.shadow.mapSize.height = 2048
      scene.add(spotLight)

      const goldLight = new THREE.PointLight(0xd4a24a, 0.5)
      goldLight.position.set(-10, -10, -10)
      scene.add(goldLight)

      // Setup orbit controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.autoRotate = config.autoRotate
      controls.autoRotateSpeed = 0.5
      controls.enablePan = false
      controls.minPolarAngle = Math.PI / 4
      controls.maxPolarAngle = Math.PI / 1.5
      controls.minDistance = 2
      controls.maxDistance = 10

      // Load model
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath(
        "https://unpkg.com/three@0.170.0/examples/jsm/libs/draco/"
      )

      const gltfLoader = new GLTFLoader()
      gltfLoader.setDRACOLoader(dracoLoader)

      gltfLoader.load(
        modelData.modelUrl,
        (gltf) => {
          const model = gltf.scene

          // Apply transforms
          model.scale.setScalar(modelData.scale || 1)
          model.position.set(
            modelData.position?.x || 0,
            modelData.position?.y || 0,
            modelData.position?.z || 0
          )
          model.rotation.set(
            modelData.rotation?.x || 0,
            modelData.rotation?.y || 0,
            modelData.rotation?.z || 0
          )

          // Center model
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          model.position.sub(center)

          scene.add(model)

          // Hide loading
          loadingElement.classList.add("hidden")

          console.log("[Showcase3D] Model loaded successfully")
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100
          console.log(`[Showcase3D] Loading: ${percent.toFixed(0)}%`)
        },
        (error) => {
          console.error("[Showcase3D] Model loading error:", error)
          showError(container, "Failed to load 3D model")
        }
      )

      // Animation loop
      function animate() {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        const width = viewerElement.clientWidth
        const height = viewerElement.clientHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      })
      resizeObserver.observe(viewerElement)

      // Cleanup on page leave
      window.addEventListener("beforeunload", () => {
        resizeObserver.disconnect()
        renderer.dispose()
      })
    } catch (error) {
      console.error("[Showcase3D] Initialization error:", error)
      showError(container, "Unable to load 3D viewer")
    }
  }

  /**
   * Show error state
   */
  function showError(container, message) {
    const viewerElement = container.querySelector(".showcase3d-viewer")
    const loadingElement = container.querySelector(".showcase3d-loading")

    if (loadingElement) {
      loadingElement.classList.add("hidden")
    }

    const errorHtml = `
      <div class="showcase3d-error">
        <div class="showcase3d-error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
          </svg>
        </div>
        <span>${message}</span>
      </div>
    `

    viewerElement.insertAdjacentHTML("beforeend", errorHtml)
  }

  /**
   * Initialize all viewers on page
   */
  function initAllViewers() {
    const containers = document.querySelectorAll(".showcase3d-viewer-container")

    containers.forEach((container) => {
      // Use Intersection Observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              observer.disconnect()
              initViewer(container)
            }
          })
        },
        { rootMargin: "100px" }
      )

      observer.observe(container)
    })
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllViewers)
  } else {
    initAllViewers()
  }

  // Expose for debugging
  window.Showcase3D = {
    initViewer,
    initAllViewers,
  }
})()
