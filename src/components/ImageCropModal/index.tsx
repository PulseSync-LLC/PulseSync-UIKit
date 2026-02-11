'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area, Point } from 'react-easy-crop'
import styles from './imageCropModal.module.scss'
import { Button } from '../Button'

export type CropType = 'avatar' | 'banner'

export interface ImageCropModalLabels {
    avatarTitle?: string
    bannerTitle?: string
    zoom?: string
    aspectRatio?: string
    resolution?: string
    maxSize?: string
    cancel?: string
    save?: string
    loading?: string
    close?: string
}

export interface ImageCropModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (croppedBlob: Blob) => void
    imageUrl: string
    cropType: CropType
    loading?: boolean
    labels?: ImageCropModalLabels
}

const DEFAULT_LABELS: Required<ImageCropModalLabels> = {
    avatarTitle: 'Crop Avatar',
    bannerTitle: 'Crop Banner',
    zoom: 'Zoom',
    aspectRatio: 'Aspect Ratio',
    resolution: 'Resolution',
    maxSize: 'Max Size',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    close: 'Close',
}

const CROP_CONFIGS: Record<
    CropType,
    {
        aspect: number
        cropShape: 'rect' | 'round'
        maxFileSize: number
        maxFileSizeLabel: string
    }
> = {
    avatar: {
        aspect: 1,
        cropShape: 'rect',
        maxFileSize: 5 * 1024 * 1024,
        maxFileSizeLabel: '5 MB',
    },
    banner: {
        aspect: 1000 / 277,
        cropShape: 'rect',
        maxFileSize: 10 * 1024 * 1024,
        maxFileSizeLabel: '10 MB',
    },
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', error => reject(error))
        image.crossOrigin = 'anonymous'
        image.src = url
    })

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('No 2d context')
    }
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Canvas is empty'))
                }
            },
            'image/webp',
            0.92,
        )
    })
}

export function ImageCropModal({ isOpen, onClose, onSave, imageUrl, cropType, loading = false, labels }: ImageCropModalProps) {
    const l = { ...DEFAULT_LABELS, ...labels }
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const config = CROP_CONFIGS[cropType]

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = useCallback(async () => {
        if (!croppedAreaPixels) return
        try {
            const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels)
            onSave(croppedBlob)
        } catch (e) {
            console.error('Error cropping image:', e)
        }
    }, [croppedAreaPixels, imageUrl, onSave])

    if (!isOpen) return null

    const resolutionInfo = croppedAreaPixels ? `${Math.round(croppedAreaPixels.width)}×${Math.round(croppedAreaPixels.height)}` : '—'

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {cropType === 'avatar' ? l.avatarTitle : l.bannerTitle}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label={l.close}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.cropContainer}>
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={config.aspect}
                        cropShape={config.cropShape}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        showGrid={true}
                        classes={{
                            containerClassName: styles.cropperContainer,
                            mediaClassName: styles.cropperMedia,
                        }}
                    />
                </div>

                <div className={styles.controls}>
                    <div className={styles.zoomControl}>
                        <label className={styles.zoomLabel}>{l.zoom}</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className={styles.zoomSlider}
                        />
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.sizeHint}>
                            {l.aspectRatio}: {cropType === 'avatar' ? '1:1' : '1000:277'}
                        </span>
                        <span className={styles.sizeHint}>
                            {l.resolution}: {resolutionInfo}
                        </span>
                        <span className={styles.sizeHint}>
                            {l.maxSize}: {config.maxFileSizeLabel}
                        </span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" size="md" onClick={onClose} disabled={loading} fullWidth>
                        {l.cancel}
                    </Button>
                    <Button variant="primary" size="md" onClick={handleSave} disabled={loading || !croppedAreaPixels} loading={loading} fullWidth>
                        {l.save}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ImageCropModal
