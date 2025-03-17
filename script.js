// 全局变量
let scene, camera, renderer, world;
let coins = [];
let coinBodies = [];
let isAnimating = false;
let resultDisplayed = false;
let controls;
let textureGenerator;
let debugInfo = [];

// 调试日志函数
function log(message) {
    console.log(message);
    debugInfo.push(`${new Date().toLocaleTimeString()}: ${message}`);
    updateDebugPanel();
}

// 更新调试面板
function updateDebugPanel() {
    const debugElement = document.getElementById('debug-info');
    if (debugElement) {
        // 保留最新的50条日志
        while (debugInfo.length > 50) {
            debugInfo.shift();
        }
        debugElement.textContent = debugInfo.join('\n');
        // 自动滚动到底部
        debugElement.scrollTop = debugElement.scrollHeight;
    }
}

// 八卦解释
const hexagramMeanings = {
    '阳阳阳': { name: '乾卦 ☰', meaning: '乾为天，刚健中正。象征天行健，君子以自强不息。' },
    '阴阴阴': { name: '坤卦 ☷', meaning: '坤为地，柔顺厚德。象征地势坤，君子以厚德载物。' },
    '阳阴阳': { name: '震卦 ☳', meaning: '震为雷，震惊百里。象征雷霆行动，君子以恐惧修省。' },
    '阴阳阴': { name: '艮卦 ☶', meaning: '艮为山，刚止而静。象征山不动，君子以思不出其位。' },
    '阳阳阴': { name: '坎卦 ☵', meaning: '坎为水，险陷不测。象征行险而不失其信，君子以修身节行。' },
    '阴阴阳': { name: '离卦 ☲', meaning: '离为火，丽泽明白。象征日月丽天，君子以继明照于四方。' },
    '阴阳阳': { name: '兑卦 ☱', meaning: '兑为泽，喜悦和顺。象征刚内柔外，君子以和愉群众。' },
    '阳阴阴': { name: '巽卦 ☴', meaning: '巽为风，谦逊随顺。象征无孔不入，君子以广行教化。' }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    log('DOM加载完成，初始化应用');
    
    // 检查必要的库是否加载
    if (!window.THREE) {
        log('错误: Three.js 未加载');
        showError('Three.js 库加载失败，请检查网络连接并刷新页面。');
        return;
    }
    
    // 检查物理引擎是否加载
    let cannonLoaded = false;
    if (!window.CANNON) {
        log('错误: Cannon.js 未加载');
        log('尝试使用备用方法...');
        
        // 创建一个简单的模拟物理引擎
        window.CANNON = createFallbackPhysicsEngine();
        cannonLoaded = true;
        log('已创建备用物理引擎');
    } else {
        cannonLoaded = true;
        log('Cannon.js 已加载');
    }
    
    if (cannonLoaded) {
        // 初始化应用
        initApp();
    } else {
        showError('物理引擎未加载，请刷新页面重试。');
    }
    
    // 设置调试面板切换
    const toggleDebug = document.getElementById('toggle-debug');
    if (toggleDebug) {
        toggleDebug.addEventListener('click', () => {
            const debugPanel = document.getElementById('debug-panel');
            if (debugPanel) {
                debugPanel.style.display = debugPanel.style.display === 'none' || !debugPanel.style.display ? 'block' : 'none';
            }
        });
    }
});

// 创建备用物理引擎
function createFallbackPhysicsEngine() {
    log('创建备用物理引擎');
    
    // 简单的物理引擎模拟
    const fallbackEngine = {
        // 基本向量类
        Vec3: function(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            
            this.set = function(x, y, z) {
                this.x = x || 0;
                this.y = y || 0;
                this.z = z || 0;
                return this;
            };
            
            this.copy = function(v) {
                this.x = v.x;
                this.y = v.y;
                this.z = v.z;
                return this;
            };
        },
        
        // 四元数类
        Quaternion: function(x, y, z, w) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = w || 1;
            
            this.setFromAxisAngle = function(axis, angle) {
                const s = Math.sin(angle / 2);
                this.x = axis.x * s;
                this.y = axis.y * s;
                this.z = axis.z * s;
                this.w = Math.cos(angle / 2);
                return this;
            };
            
            this.setFromEuler = function(x, y, z) {
                const c1 = Math.cos(x / 2);
                const c2 = Math.cos(y / 2);
                const c3 = Math.cos(z / 2);
                const s1 = Math.sin(x / 2);
                const s2 = Math.sin(y / 2);
                const s3 = Math.sin(z / 2);
                
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
                
                return this;
            };
            
            this.copy = function(q) {
                this.x = q.x;
                this.y = q.y;
                this.z = q.z;
                this.w = q.w;
                return this;
            };
        },
        
        // 简单的形状类
        Plane: function() {
            this.type = 'plane';
        },
        
        Box: function(halfExtents) {
            this.type = 'box';
            this.halfExtents = halfExtents;
        },
        
        Cylinder: function(radiusTop, radiusBottom, height, numSegments) {
            this.type = 'cylinder';
            this.radiusTop = radiusTop;
            this.radiusBottom = radiusBottom;
            this.height = height;
            this.numSegments = numSegments || 8;
        },
        
        // 刚体类
        Body: function(options) {
            this.position = new fallbackEngine.Vec3();
            this.quaternion = new fallbackEngine.Quaternion();
            this.velocity = new fallbackEngine.Vec3();
            this.angularVelocity = new fallbackEngine.Vec3();
            this.force = new fallbackEngine.Vec3();
            this.torque = new fallbackEngine.Vec3();
            this.mass = options.mass || 0;
            this.shape = options.shape;
            
            if (options.position) {
                this.position.copy(options.position);
            }
            
            this.applyForce = function(force, worldPoint) {
                this.force.x += force.x;
                this.force.y += force.y;
                this.force.z += force.z;
            };
            
            this.applyImpulse = function(impulse, worldPoint) {
                if (this.mass > 0) {
                    this.velocity.x += impulse.x / this.mass;
                    this.velocity.y += impulse.y / this.mass;
                    this.velocity.z += impulse.z / this.mass;
                }
            };
        },
        
        // 物理世界类
        World: function() {
            this.bodies = [];
            this.gravity = new fallbackEngine.Vec3(0, -9.82, 0);
            
            this.addBody = function(body) {
                this.bodies.push(body);
            };
            
            this.step = function(dt) {
                // 简单的物理更新
                for (let i = 0; i < this.bodies.length; i++) {
                    const body = this.bodies[i];
                    
                    if (body.mass > 0) {
                        // 应用重力
                        body.velocity.x += this.gravity.x * dt;
                        body.velocity.y += this.gravity.y * dt;
                        body.velocity.z += this.gravity.z * dt;
                        
                        // 更新位置
                        body.position.x += body.velocity.x * dt;
                        body.position.y += body.velocity.y * dt;
                        body.position.z += body.velocity.z * dt;
                        
                        // 更新旋转
                        const angVelDt = {
                            x: body.angularVelocity.x * dt,
                            y: body.angularVelocity.y * dt,
                            z: body.angularVelocity.z * dt
                        };
                        
                        // 简单的旋转更新
                        const dq = new fallbackEngine.Quaternion();
                        dq.setFromEuler(angVelDt.x, angVelDt.y, angVelDt.z);
                        
                        const newQ = new fallbackEngine.Quaternion(
                            body.quaternion.x,
                            body.quaternion.y,
                            body.quaternion.z,
                            body.quaternion.w
                        );
                        
                        // 简单的四元数乘法
                        const qx = dq.x * newQ.w + dq.w * newQ.x + dq.y * newQ.z - dq.z * newQ.y;
                        const qy = dq.y * newQ.w + dq.w * newQ.y + dq.z * newQ.x - dq.x * newQ.z;
                        const qz = dq.z * newQ.w + dq.w * newQ.z + dq.x * newQ.y - dq.y * newQ.x;
                        const qw = dq.w * newQ.w - dq.x * newQ.x - dq.y * newQ.y - dq.z * newQ.z;
                        
                        body.quaternion.x = qx;
                        body.quaternion.y = qy;
                        body.quaternion.z = qz;
                        body.quaternion.w = qw;
                        
                        // 简单的碰撞检测 - 地面碰撞
                        if (body.position.y < body.shape.height / 2) {
                            body.position.y = body.shape.height / 2;
                            body.velocity.y = -body.velocity.y * 0.5; // 反弹，能量损失
                            
                            // 摩擦力
                            body.velocity.x *= 0.95;
                            body.velocity.z *= 0.95;
                            body.angularVelocity.x *= 0.95;
                            body.angularVelocity.y *= 0.95;
                            body.angularVelocity.z *= 0.95;
                        }
                    }
                }
            };
        }
    };
    
    // 添加一些辅助方法
    fallbackEngine.NaiveBroadphase = function() {};
    
    return fallbackEngine;
}

// 显示错误信息
function showError(message) {
    const resultText = document.getElementById('result-text');
    if (resultText) {
        resultText.textContent = '出错了';
        resultText.style.color = 'red';
    }
    
    const resultMeaning = document.getElementById('result-meaning');
    if (resultMeaning) {
        resultMeaning.textContent = message;
        resultMeaning.style.color = 'red';
    }
}

// 初始化应用
function initApp() {
    try {
        // 显示调试面板
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.style.display = 'block';
        }
        
        // 显示初始信息
        log('应用初始化开始');
        log(`浏览器: ${navigator.userAgent}`);
        log(`Three.js 版本: ${THREE.REVISION || '未知'}`);
        
        // 创建纹理生成器
        if (window.CoinTextureGenerator) {
            textureGenerator = new CoinTextureGenerator();
            log('纹理生成器创建成功');
        } else {
            log('错误: 纹理生成器未定义');
            showError('纹理生成器加载失败，请刷新页面重试。');
            return;
        }
        
        // 初始化3D场景
        init();
        
        // 开始动画循环
        animate();
        
        // 确保按钮事件监听器正确添加
        const tossButton = document.getElementById('toss-button');
        if (tossButton) {
            log('找到投掷按钮，添加事件监听器');
            tossButton.addEventListener('click', function() {
                log('按钮被点击');
                tossCoins();
            });
        } else {
            log('错误: 未找到投掷按钮');
        }
    } catch (error) {
        log(`初始化应用时发生错误: ${error.message}`);
        showError('初始化失败，请刷新页面重试。');
    }
}

// 初始化场景
function init() {
    log('初始化3D场景');
    
    try {
        // 创建Three.js场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5e6ca);
        log('场景创建成功');

        // 创建相机
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 10, 20);
        log('相机创建成功');

        // 创建渲染器
        const container = document.getElementById('coin-scene');
        if (!container) {
            log('错误: 未找到coin-scene容器');
            return;
        }
        
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        log('渲染器创建成功');

        // 添加轨道控制
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2;
        log('轨道控制器创建成功');

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        scene.add(directionalLight);
        log('光源添加成功');

        // 创建物理世界
        if (window.CANNON) {
            world = new CANNON.World();
            world.gravity.set(0, -9.82, 0);
            
            // 根据不同版本的Cannon.js使用不同的API
            if (CANNON.NaiveBroadphase) {
                world.broadphase = new CANNON.NaiveBroadphase();
            } else if (CANNON.World.prototype.defaultBroadphase) {
                // 旧版本可能使用默认的broadphase
                world.broadphase = new CANNON.World.prototype.defaultBroadphase();
            }
            
            // 设置求解器迭代次数
            if (world.solver) {
                world.solver.iterations = 10;
            }
            
            log('物理世界创建成功');
        } else {
            log('错误: CANNON未定义，无法创建物理世界');
            showError('物理引擎未加载，请刷新页面重试。');
            return;
        }

        // 创建地面
        createGround();

        // 创建硬币
        createCoins();

        // 窗口大小调整
        window.addEventListener('resize', onWindowResize);
        
        // 立即调整一次大小以确保比例正确
        onWindowResize();
        
        log('3D场景初始化完成');
    } catch (error) {
        log(`初始化过程中发生错误: ${error.message}`);
        showError('初始化3D场景失败，请刷新页面重试。');
    }
}

// 创建地面
function createGround() {
    try {
        // Three.js地面
        const textureLoader = new THREE.TextureLoader();
        const groundTexture = textureLoader.load('https://img.freepik.com/free-photo/chinese-red-silk-texture_53876-90505.jpg', 
            // 成功加载回调
            function(texture) {
                log('地面纹理加载成功');
            },
            // 加载进度回调
            undefined,
            // 错误回调
            function(err) {
                log(`地面纹理加载失败: ${err}`);
                // 使用纯色作为备选
                ground.material.map = null;
                ground.material.color.set(0x8b0000);
                ground.material.needsUpdate = true;
            }
        );
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(4, 4);
        
        const groundGeometry = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: groundTexture,
            side: THREE.DoubleSide,
            roughness: 0.7,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        log('3D地面创建成功');

        // Cannon.js地面 - 适配不同版本API
        let groundShape;
        if (CANNON.Plane) {
            groundShape = new CANNON.Plane();
        } else {
            // 旧版本可能使用Box作为平面
            groundShape = new CANNON.Box(new CANNON.Vec3(15, 0.1, 15));
        }
        
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape
        });
        
        // 设置地面旋转 - 适配不同版本API
        if (groundBody.quaternion.setFromAxisAngle) {
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        } else {
            // 旧版本可能使用不同的方法
            const q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            groundBody.quaternion.copy(q);
        }
        
        world.addBody(groundBody);
        log('物理地面创建成功');
    } catch (error) {
        log(`创建地面时发生错误: ${error.message}`);
    }
}

// 创建硬币
function createCoins() {
    try {
        log('开始创建硬币');
        
        // 生成自定义纹理
        const headTextureUrl = textureGenerator.generateHeadTexture();
        const tailTextureUrl = textureGenerator.generateTailTexture();
        log('硬币纹理生成完成');
        
        // 加载纹理
        const textureLoader = new THREE.TextureLoader();
        const headTexture = textureLoader.load(headTextureUrl);
        const tailTexture = textureLoader.load(tailTextureUrl);
        
        // 硬币几何体 - 修改方向，使其水平放置
        // 使用CylinderGeometry，但旋转90度使其水平放置
        const coinGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
        // 旋转几何体使其水平放置
        coinGeometry.rotateX(Math.PI / 2);
        
        // 创建三枚硬币
        for (let i = 0; i < 3; i++) {
            // 硬币材质
            const headMaterial = new THREE.MeshStandardMaterial({ 
                map: headTexture,
                metalness: 0.5,
                roughness: 0.5,
                color: 0xd4af37
            });
            
            const tailMaterial = new THREE.MeshStandardMaterial({ 
                map: tailTexture,
                metalness: 0.5,
                roughness: 0.5,
                color: 0xd4af37
            });
            
            const edgeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xd4af37,
                metalness: 0.8,
                roughness: 0.5
            });
            
            // 创建硬币网格
            const materials = [edgeMaterial, headMaterial, tailMaterial];
            const coin = new THREE.Mesh(coinGeometry, materials);
            
            // 添加中国古代铜钱的方孔
            const holeGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
            // 旋转方孔使其与硬币方向匹配
            holeGeometry.rotateX(Math.PI / 2);
            
            const holeMesh = new THREE.Mesh(holeGeometry, new THREE.MeshBasicMaterial({ 
                color: 0xf5e6ca,
                transparent: true,
                opacity: 0.9
            }));
            coin.add(holeMesh);
            
            // 设置硬币位置
            coin.position.set((i - 1) * 5, 10 + i * 2, 0);
            coin.castShadow = true;
            coin.receiveShadow = true;
            
            // 添加到场景
            scene.add(coin);
            coins.push(coin);
            
            // 创建物理硬币 - 适配不同版本API
            let coinShape;
            if (CANNON.Cylinder) {
                // 注意：Cannon.js中的圆柱体默认是Y轴向上的
                // 参数顺序：radiusTop, radiusBottom, height, numSegments
                coinShape = new CANNON.Cylinder(2, 2, 0.2, 32);
            } else {
                // 旧版本可能使用不同的构造函数
                coinShape = new CANNON.Cylinder(2, 2, 0.2);
            }
            
            const coinBody = new CANNON.Body({
                mass: 1,
                shape: coinShape,
                position: new CANNON.Vec3((i - 1) * 5, 10 + i * 2, 0)
            });
            
            // 旋转物理硬币，使其与视觉模型匹配
            // 将物理硬币旋转90度，使其与视觉模型匹配
            const q = new CANNON.Quaternion();
            q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
            coinBody.quaternion.copy(q);
            
            // 添加到物理世界
            world.addBody(coinBody);
            coinBodies.push(coinBody);
        }
        
        log(`硬币创建完成，共创建了 ${coins.length} 枚硬币`);
    } catch (error) {
        log(`创建硬币时发生错误: ${error.message}`);
    }
}

// 抛掷硬币
function tossCoins() {
    log('开始抛掷硬币');
    
    if (isAnimating) {
        log('动画正在进行中，忽略此次点击');
        return;
    }
    
    isAnimating = true;
    resultDisplayed = false;
    
    // 重置结果显示
    const resultText = document.getElementById('result-text');
    const resultMeaning = document.getElementById('result-meaning');
    
    if (resultText) resultText.textContent = '';
    if (resultMeaning) resultMeaning.textContent = '';
    
    try {
        // 重置硬币位置
        for (let i = 0; i < 3; i++) {
            // 随机位置和旋转
            const x = (i - 1) * 5 + (Math.random() - 0.5) * 2;
            const y = 10 + i * 2;
            const z = (Math.random() - 0.5) * 2;
            
            // 设置物理硬币位置
            coinBodies[i].position.set(x, y, z);
            
            // 随机旋转和速度
            const rotX = Math.random() * Math.PI * 2;
            const rotY = Math.random() * Math.PI * 2;
            const rotZ = Math.random() * Math.PI * 2;
            
            // 创建一个基础四元数，表示硬币的初始旋转（与视觉模型匹配）
            const baseQuaternion = new CANNON.Quaternion();
            baseQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
            
            // 创建随机旋转的四元数
            const randomQuaternion = new CANNON.Quaternion();
            randomQuaternion.setFromEuler(rotX, rotY, rotZ);
            
            // 将两个四元数相乘，得到最终的旋转
            // 注意：四元数乘法顺序很重要
            // 根据不同版本的Cannon.js使用不同的API设置旋转
            if (coinBodies[i].quaternion.mult) {
                // 如果有mult方法，直接使用
                coinBodies[i].quaternion.copy(baseQuaternion);
                coinBodies[i].quaternion.mult(randomQuaternion, coinBodies[i].quaternion);
            } else {
                // 否则，使用简化的方法
                // 简单的四元数乘法
                const q1 = baseQuaternion;
                const q2 = randomQuaternion;
                
                const qx = q1.x * q2.w + q1.w * q2.x + q1.y * q2.z - q1.z * q2.y;
                const qy = q1.y * q2.w + q1.w * q2.y + q1.z * q2.x - q1.x * q2.z;
                const qz = q1.z * q2.w + q1.w * q2.z + q1.x * q2.y - q1.y * q2.x;
                const qw = q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z;
                
                coinBodies[i].quaternion.x = qx;
                coinBodies[i].quaternion.y = qy;
                coinBodies[i].quaternion.z = qz;
                coinBodies[i].quaternion.w = qw;
            }
            
            // 添加随机冲量 - 适配不同版本API
            if (coinBodies[i].applyImpulse) {
                coinBodies[i].applyImpulse(
                    new CANNON.Vec3(
                        (Math.random() - 0.5) * 5,
                        Math.random() * 5 + 5,
                        (Math.random() - 0.5) * 5
                    ),
                    new CANNON.Vec3(0, 0, 0)
                );
            } else if (coinBodies[i].applyForce) {
                // 旧版本可能使用applyForce
                coinBodies[i].applyForce(
                    new CANNON.Vec3(
                        (Math.random() - 0.5) * 50,
                        Math.random() * 50 + 50,
                        (Math.random() - 0.5) * 50
                    ),
                    new CANNON.Vec3(0, 0, 0)
                );
            }
            
            // 添加随机角速度
            const angVelX = (Math.random() - 0.5) * 10;
            const angVelY = (Math.random() - 0.5) * 10;
            const angVelZ = (Math.random() - 0.5) * 10;
            
            coinBodies[i].angularVelocity.set(angVelX, angVelY, angVelZ);
            
            log(`硬币 ${i+1} 已设置初始状态并施加力量`);
        }
        
        // 添加动画效果
        const button = document.getElementById('toss-button');
        if (button) {
            button.disabled = true;
            button.textContent = '铜钱翻转中...';
        }
        
        log('硬币已抛出，5秒后检查结果');
        
        // 5秒后检查结果
        setTimeout(checkResults, 5000);
    } catch (error) {
        log(`抛掷硬币时发生错误: ${error.message}`);
        isAnimating = false;
        
        // 恢复按钮状态
        const button = document.getElementById('toss-button');
        if (button) {
            button.disabled = false;
            button.textContent = '抛掷铜钱';
        }
    }
}

// 检查结果
function checkResults() {
    log('检查硬币结果');
    
    isAnimating = false;
    resultDisplayed = true;
    
    // 启用按钮
    const button = document.getElementById('toss-button');
    if (button) {
        button.disabled = false;
        button.textContent = '再次抛掷';
    }
    
    try {
        // 确定每个硬币的正反面
        const results = [];
        
        for (let i = 0; i < 3; i++) {
            // 获取硬币的旋转 - 适配不同版本API
            let rotation;
            
            try {
                // 尝试使用Three.js的Euler和Quaternion
                rotation = new THREE.Euler().setFromQuaternion(
                    new THREE.Quaternion(
                        coinBodies[i].quaternion.x,
                        coinBodies[i].quaternion.y,
                        coinBodies[i].quaternion.z,
                        coinBodies[i].quaternion.w
                    )
                );
            } catch (err) {
                // 如果失败，使用简化的方法
                log(`使用简化方法获取硬币 ${i+1} 的旋转`);
                
                // 简化：直接使用y轴位置判断
                const yPos = coinBodies[i].position.y;
                const result = Math.random() > 0.5 ? '阳' : '阴'; // 随机选择
                results.push(result);
                log(`硬币 ${i+1} 结果(简化): ${result}, y位置: ${yPos}`);
                continue;
            }
            
            // 由于我们旋转了硬币几何体，现在需要根据y轴的朝向判断正反面
            // 获取硬币的上方向（y轴）
            const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(
                new THREE.Quaternion(
                    coinBodies[i].quaternion.x,
                    coinBodies[i].quaternion.y,
                    coinBodies[i].quaternion.z,
                    coinBodies[i].quaternion.w
                )
            );
            
            // 计算上方向与世界y轴的点积，判断朝向
            const dotProduct = upVector.dot(new THREE.Vector3(0, 1, 0));
            
            let result;
            // 如果点积接近1或-1，说明硬币基本平放
            if (Math.abs(dotProduct) > 0.7) {
                // 根据点积正负判断正反面
                result = dotProduct > 0 ? '阳' : '阴';
            } else {
                // 如果硬币竖起来了，随机选择
                result = Math.random() > 0.5 ? '阳' : '阴';
            }
            
            results.push(result);
            log(`硬币 ${i+1} 结果: ${result}, 点积: ${dotProduct}`);
        }
        
        log(`最终结果: ${results.join('')}`);
        
        // 显示结果
        const resultKey = results.join('');
        const resultText = document.getElementById('result-text');
        const resultMeaning = document.getElementById('result-meaning');
        
        if (resultText && resultMeaning) {
            if (hexagramMeanings[resultKey]) {
                resultText.textContent = `${results[0]} ${results[1]} ${results[2]} - ${hexagramMeanings[resultKey].name}`;
                resultMeaning.textContent = hexagramMeanings[resultKey].meaning;
                
                // 添加淡入效果
                resultText.classList.add('fade-in');
                resultMeaning.classList.add('fade-in');
                
                // 移除动画类以便下次使用
                setTimeout(() => {
                    resultText.classList.remove('fade-in');
                    resultMeaning.classList.remove('fade-in');
                }, 1000);
                
                log('结果显示完成');
            } else {
                log(`错误: 未找到结果键 "${resultKey}" 对应的解释`);
                resultText.textContent = `${results[0]} ${results[1]} ${results[2]}`;
                resultMeaning.textContent = '无法解析此卦象，请重新抛掷。';
            }
        } else {
            log('错误: 未找到结果显示元素');
        }
    } catch (error) {
        log(`检查结果时发生错误: ${error.message}`);
    }
}

// 窗口大小调整
function onWindowResize() {
    try {
        const container = document.getElementById('coin-scene');
        if (!container || !camera || !renderer) {
            log('调整大小时找不到必要的元素');
            return;
        }
        
        // 获取容器的实际尺寸
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        if (width === 0 || height === 0) {
            log('警告: 容器尺寸为零，使用默认值');
            camera.aspect = 1;
        } else {
            camera.aspect = width / height;
        }
        
        camera.updateProjectionMatrix();
        renderer.setSize(width || 400, height || 400);
        
        log(`视图大小已调整为 ${width} x ${height}`);
    } catch (error) {
        log(`调整窗口大小时发生错误: ${error.message}`);
    }
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    try {
        // 更新物理世界
        if (world) {
            // 使用固定的时间步长
            const timeStep = 1/60;
            world.step(timeStep);
            
            // 更新硬币位置
            for (let i = 0; i < coins.length; i++) {
                if (coins[i] && coinBodies[i]) {
                    // 从物理引擎复制位置到Three.js对象
                    coins[i].position.copy(new THREE.Vector3(
                        coinBodies[i].position.x,
                        coinBodies[i].position.y,
                        coinBodies[i].position.z
                    ));
                    
                    // 从物理引擎复制旋转到Three.js对象
                    coins[i].quaternion.copy(new THREE.Quaternion(
                        coinBodies[i].quaternion.x,
                        coinBodies[i].quaternion.y,
                        coinBodies[i].quaternion.z,
                        coinBodies[i].quaternion.w
                    ));
                }
            }
        }
        
        // 更新控制器
        if (controls) {
            controls.update();
        }
        
        // 渲染场景
        if (scene && camera && renderer) {
            renderer.render(scene, camera);
        }
    } catch (error) {
        log(`动画循环中发生错误: ${error.message}`);
    }
}

// 添加中国风装饰元素
function addDecorations() {
    try {
        log('添加装饰元素');
        
        // 添加云纹装饰
        const cloudGeometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0xd4af37,
            emissiveIntensity: 0.2
        });
        
        const cloud1 = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud1.position.set(-10, 5, -5);
        cloud1.scale.set(0.5, 0.5, 0.5);
        scene.add(cloud1);
        
        const cloud2 = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud2.position.set(10, 5, -5);
        cloud2.scale.set(0.5, 0.5, 0.5);
        scene.add(cloud2);
        
        // 添加动画
        function animateDecorations() {
            cloud1.rotation.x += 0.01;
            cloud1.rotation.y += 0.01;
            cloud2.rotation.x += 0.01;
            cloud2.rotation.y += 0.01;
            
            requestAnimationFrame(animateDecorations);
        }
        
        animateDecorations();
        log('装饰元素添加完成');
    } catch (error) {
        log(`添加装饰元素时发生错误: ${error.message}`);
    }
}

// 初始化后添加装饰
setTimeout(addDecorations, 1000); 