// 硬币纹理生成器
class CoinTextureGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 512;
        this.canvas.height = 512;
        this.ctx = this.canvas.getContext('2d');
        console.log('纹理生成器初始化完成');
    }
    
    // 生成正面纹理
    generateHeadTexture() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 设置背景色 - 古铜色
        ctx.fillStyle = '#b87333';
        ctx.fillRect(0, 0, width, height);
        
        // 添加纹理效果
        this.addNoiseTexture(0.2);
        
        // 绘制硬币外圈
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = width * 0.03;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制中间方孔
        ctx.fillStyle = '#000';
        const holeSize = width * 0.15;
        ctx.fillRect(width / 2 - holeSize / 2, height / 2 - holeSize / 2, holeSize, holeSize);
        
        // 添加古代文字 - 正面"天下太平"
        ctx.fillStyle = '#000';
        ctx.font = `bold ${width * 0.08}px 'Ma Shan Zheng', cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 上方文字
        ctx.fillText('天', width / 2, height * 0.25);
        
        // 右侧文字
        ctx.fillText('下', width * 0.75, height / 2);
        
        // 下方文字
        ctx.fillText('太', width / 2, height * 0.75);
        
        // 左侧文字
        ctx.fillText('平', width * 0.25, height / 2);
        
        // 添加装饰纹路
        this.addDecorativePatterns();
        
        return this.canvas.toDataURL();
    }
    
    // 生成反面纹理
    generateTailTexture() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 设置背景色 - 略深的古铜色
        ctx.fillStyle = '#a06623';
        ctx.fillRect(0, 0, width, height);
        
        // 添加纹理效果
        this.addNoiseTexture(0.3);
        
        // 绘制硬币外圈
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = width * 0.03;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, width * 0.45, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制中间方孔
        ctx.fillStyle = '#000';
        const holeSize = width * 0.15;
        ctx.fillRect(width / 2 - holeSize / 2, height / 2 - holeSize / 2, holeSize, holeSize);
        
        // 添加古代文字 - 反面"乾隆通宝"
        ctx.fillStyle = '#000';
        ctx.font = `bold ${width * 0.08}px 'Ma Shan Zheng', cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 上方文字
        ctx.fillText('乾', width / 2, height * 0.25);
        
        // 右侧文字
        ctx.fillText('隆', width * 0.75, height / 2);
        
        // 下方文字
        ctx.fillText('通', width / 2, height * 0.75);
        
        // 左侧文字
        ctx.fillText('宝', width * 0.25, height / 2);
        
        // 添加不同的装饰纹路
        this.addDecorativePatterns(true);
        
        return this.canvas.toDataURL();
    }
    
    // 添加噪点纹理
    addNoiseTexture(intensity = 0.2) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 获取当前图像数据
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // 添加噪点
        for (let i = 0; i < data.length; i += 4) {
            // 随机噪点
            const noise = (Math.random() - 0.5) * intensity * 255;
            
            // 应用到RGB通道
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        
        // 将修改后的图像数据放回画布
        ctx.putImageData(imageData, 0, 0);
    }
    
    // 添加装饰纹路
    addDecorativePatterns(isReverse = false) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 设置装饰样式
        ctx.strokeStyle = isReverse ? '#5d3a08' : '#5d3a08';
        ctx.lineWidth = width * 0.01;
        
        // 绘制圆形装饰
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = width / 2 + Math.cos(angle) * width * 0.3;
            const y = height / 2 + Math.sin(angle) * height * 0.3;
            const size = width * (isReverse ? 0.04 : 0.05);
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.stroke();
            
            if (!isReverse) {
                // 正面添加额外的小圆点
                ctx.beginPath();
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 添加放射状线条
        if (isReverse) {
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const innerX = width / 2 + Math.cos(angle) * width * 0.1;
                const innerY = height / 2 + Math.sin(angle) * height * 0.1;
                const outerX = width / 2 + Math.cos(angle) * width * 0.4;
                const outerY = height / 2 + Math.sin(angle) * height * 0.4;
                
                ctx.beginPath();
                ctx.moveTo(innerX, innerY);
                ctx.lineTo(outerX, outerY);
                ctx.stroke();
            }
        } else {
            // 正面添加波浪纹
            ctx.beginPath();
            for (let i = 0; i < 360; i += 5) {
                const angle = (i / 180) * Math.PI;
                const radius = width * 0.38 + Math.sin(i * 8 / 180 * Math.PI) * width * 0.02;
                const x = width / 2 + Math.cos(angle) * radius;
                const y = height / 2 + Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
}

// 导出纹理生成器
window.CoinTextureGenerator = CoinTextureGenerator;

// 确认纹理生成器已加载
console.log('纹理生成器脚本已加载'); 