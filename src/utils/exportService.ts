import jsPDF from 'jspdf'
import PptxGenJS from 'pptxgenjs'
import { saveAs } from 'file-saver'

export interface ExportOptions {
  title?: string
  watermark?: {
    text: string
    opacity?: number
    fontSize?: number
    color?: string
  }
  quality?: number
}

export interface ImageData {
  url: string
  index: number
  title?: string
  description?: string
}

class ExportService {
  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  private addWatermark(
    ctx: CanvasRenderingContext2D,
    text: string,
    width: number,
    height: number,
    options: {
      opacity?: number
      fontSize?: number
      color?: string
    } = {}
  ) {
    const {
      opacity = 0.3,
      fontSize = 20,
      color = '#666666'
    } = options

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 旋转水印
    ctx.translate(width / 2, height / 2)
    ctx.rotate(-Math.PI / 6)

    // 绘制多行水印
    const watermarkText = text
    const lineHeight = fontSize * 2
    const x = 0
    const y = -height

    for (let row = 0; row < height * 2 / lineHeight; row++) {
      for (let col = 0; col < width * 2 / (watermarkText.length * fontSize); col++) {
        ctx.fillText(watermarkText, x + col * watermarkText.length * fontSize, y + row * lineHeight)
      }
    }

    ctx.restore()
  }

  async exportToPDF(
    images: ImageData[],
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pageWidth - 2 * margin
      const contentHeight = pageHeight - 2 * margin

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const imageData = images[i]
        const img = await this.loadImage(imageData.url)

        // 计算图片适配尺寸
        const imgAspectRatio = img.width / img.height
        const maxAspectRatio = contentWidth / contentHeight

        let finalWidth, finalHeight
        if (imgAspectRatio > maxAspectRatio) {
          finalWidth = contentWidth
          finalHeight = contentWidth / imgAspectRatio
        } else {
          finalHeight = contentHeight
          finalWidth = contentHeight * imgAspectRatio
        }

        const x = (pageWidth - finalWidth) / 2
        const y = (pageHeight - finalHeight) / 2 + 10

        // 添加图片到PDF
        pdf.addImage(img, 'PNG', x, y, finalWidth, finalHeight)

        // 添加页面标题
        if (imageData.title || options.title) {
          pdf.setFontSize(16)
          pdf.text(imageData.title || `${options.title} - 第${i + 1}页`, pageWidth / 2, 15, { align: 'center' })
        }

        // 添加水印
        if (options.watermark) {
          for (let y = 0; y < pageHeight; y += 30) {
            for (let x = 0; x < pageWidth; x += 60) {
              pdf.setFontSize(options.watermark.fontSize || 12)
              pdf.setTextColor(options.watermark.color || '#cccccc')
              // pdf.setGState(new pdf.GState({ opacity: options.watermark.opacity || 0.3 }))
              pdf.text(options.watermark.text, x, y, { angle: -45 })
            }
          }
        }
      }

      const filename = `${options.title || 'rednote'}_${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(filename)
    } catch (error) {
      console.error('PDF导出失败:', error)
      throw new Error('PDF导出失败')
    }
  }

  async exportToLongImage(
    images: ImageData[],
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      const targetWidth = 750 // 目标宽度
      const spacing = 20 // 图片间距
      const padding = 40 // 上下边距

      // 加载所有图片
      const loadedImages = await Promise.all(
        images.map(async (imageData) => {
          const img = await this.loadImage(imageData.url)
          const aspectRatio = img.width / img.height
          const height = targetWidth / aspectRatio
          return { img, height, data: imageData }
        })
      )

      // 计算总高度
      const totalHeight = loadedImages.reduce((sum, item) =>
        sum + item.height + spacing, padding * 2)

      // 创建canvas
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = totalHeight
      const ctx = canvas.getContext('2d')!

      // 设置背景
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, targetWidth, totalHeight)

      // 添加水印
      if (options.watermark) {
        this.addWatermark(ctx, options.watermark.text, targetWidth, totalHeight, {
          opacity: options.watermark.opacity,
          fontSize: options.watermark.fontSize || 16,
          color: options.watermark.color
        })
      }

      // 绘制图片
      let currentY = padding
      for (const { img, height, data } of loadedImages) {
        // 绘制图片
        ctx.drawImage(img, 0, currentY, targetWidth, height)

        // 添加标题
        if (data.title) {
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(data.title, targetWidth / 2, currentY - 10)
        }

        currentY += height + spacing
      }

      // 导出图片
      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `${options.title || 'rednote'}_长图_${new Date().toISOString().slice(0, 10)}.png`
          saveAs(blob, filename)
        }
      }, 'image/png', options.quality || 0.95)
    } catch (error) {
      console.error('长图导出失败:', error)
      throw new Error('长图导出失败')
    }
  }

  async exportToPPT(
    images: ImageData[],
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      const pptx = new PptxGenJS()

      // 设置演示文稿基本信息
      pptx.defineLayout({ name: 'A4', width: 2100, height: 2970 })
      pptx.layout = 'A4'

      for (let i = 0; i < images.length; i++) {
        const imageData = images[i]

        // 添加幻灯片
        const slide = pptx.addSlide()

        // 添加背景
        slide.background = { color: 'FFFFFF' }

        // 添加标题
        if (imageData.title || options.title) {
          slide.addText(imageData.title || `${options.title} - 第${i + 1}页`, {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.8,
            fontSize: 24,
            bold: true,
            align: 'center',
            color: '333333'
          })
        }

        // 添加图片
        const imgData = await this.getImageDataUrl(imageData.url)
        slide.addImage({
          data: imgData,
          x: 0.5,
          y: imageData.title ? 1.2 : 0.5,
          w: 9,
          h: 6,
          sizing: {
            type: 'contain',
            w: 9,
            h: 6
          }
        })

        // 添加水印
        if (options.watermark) {
          slide.addText(options.watermark.text, {
            x: 0,
            y: 0,
            w: 10,
            h: 7.5,
            fontSize: options.watermark.fontSize || 14,
            color: options.watermark.color || 'cccccc',
            align: 'center',
            valign: 'middle',
            rotate: -45,
            transparency: options.watermark.opacity || 30
          })
        }
      }

      const filename = `${options.title || 'rednote'}_${new Date().toISOString().slice(0, 10)}.pptx`
      await pptx.writeFile({ fileName: filename })
    } catch (error) {
      console.error('PPT导出失败:', error)
      throw new Error('PPT导出失败')
    }
  }

  private async getImageDataUrl(url: string): Promise<string> {
    const img = await this.loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  }

  async exportImagesWithWatermark(
    images: ImageData[],
    watermark: {
      text: string
      opacity?: number
      fontSize?: number
      color?: string
    }
  ): Promise<void> {
    try {
      for (const imageData of images) {
        const img = await this.loadImage(imageData.url)

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!

        // 绘制原图
        ctx.drawImage(img, 0, 0)

        // 添加水印
        this.addWatermark(ctx, watermark.text, canvas.width, canvas.height, watermark)

        // 导出带水印的图片
        canvas.toBlob((blob) => {
          if (blob) {
            const filename = `watermarked_${imageData.index + 1}.png`
            saveAs(blob, filename)
          }
        }, 'image/png', 0.95)
      }
    } catch (error) {
      console.error('水印添加失败:', error)
      throw new Error('水印添加失败')
    }
  }
}

export const exportService = new ExportService()
export default exportService