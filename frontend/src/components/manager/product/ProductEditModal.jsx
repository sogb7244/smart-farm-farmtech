import React, { useEffect, useRef, useState } from 'react'
import { getProduct, getCategory, putProduct } from '../../../api/product/product'
import { uploadImageToS3 } from '../../../api/product/upload'
import Input from '../../common/Input'
import Button from '../../common/Button'
import Select from '../../common/Select'
import styles from '../../../pages/manager/ProductRegister.module.css'
import Textarea from '../../common/Textarea'
import useAuthStore from '../../../store/authStore'

/**
 * 상품 수정 모달 컴포넌트
 *
 * @param {object}   product   - 수정 대상 상품 (ProductListDTO)
 * @param {function} onClose   - 모달 닫기 함수
 * @param {function} onSuccess - 수정 성공 후 부모 목록 갱신 콜백
 */
const ProductEditModal = ({ product, onClose, onSuccess }) => {
  const [cateList, setCateList] = useState([])

  const [form, setForm] = useState({
    categoryId:    product.categoryId,
    productName:   product.productName,
    productPrice:  product.productPrice,
    productStock:  product.productStock,
    productStatus: product.productStatus,
  })

  /** 새로 선택한 파일 (없으면 기존 이미지 유지) */
  const [mainImgFile,   setMainImgFile]   = useState(null)
  const [subImgFiles,   setSubImgFiles]   = useState([])
  const [detailImgFile, setDetailImgFile] = useState(null)

  /** 미리보기 URL (초기값 = 기존 S3 URL, 새 파일 선택 시 교체) */
  const [mainImgPreview,  setMainImgPreview]  = useState(null)
  const [subImgsPreviews, setSubImgsPreviews] = useState([])
  const [detailPreview,   setDetailPreview]   = useState(null)

  const [errors,      setErrors]      = useState({})
  const [submitError, setSubmitError] = useState(false)
  const [isLoading,setIsLoading] =useState(false);
  const {showToast} = useAuthStore();

  const mainInputRef   = useRef()
  const subInputRef    = useRef()
  const detailInputRef = useRef()

  /** 기존 서브 이미지 (S3, imageId 포함) */
  const [existingSubImgs,    setExistingSubImgs]    = useState([]) // [{imageId, imageSavedName}]
  /** 삭제 예정인 기존 서브 이미지 ID */
  const [deletedSubImageIds, setDeletedSubImageIds] = useState([])
  /** 새로 추가할 서브 이미지 파일 */
  const [newSubImgFiles,     setNewSubImgFiles]     = useState([])
  /** 새 서브 이미지 미리보기 */
  const [newSubImgPreviews,  setNewSubImgPreviews]  = useState([])


  /** 마운트 시 카테고리 + 기존 이미지 조회 */
  useEffect(() => {
    getCategory()
      .then(res => setCateList(res.data))
      .catch(err => console.error('[카테고리] 조회 실패', err))

    getProduct(product.productId)
      .then(res => {
        const detail = res.data
        const images = detail.productImageList || []

        // 상품 설명 세팅
        setForm(prev => ({
          ...prev,
          productDesc: detail.productDesc || ''
        }))

        // 이미지 세팅 (기존 코드)
        const main   = images.find(img => img.imageType === 'MAIN')
        const detailImg = images.find(img => img.imageType === 'DETAIL')
        const subs = images.filter(img => img.imageType === 'SUB')
        if (main)      setMainImgPreview(main.imageSavedName)
        if (detailImg) setDetailPreview(detailImg.imageSavedName)
        console.log('[수정모달] subs:', subs.map(s => ({ imageId: s.imageId, type: s.imageType })))
        if (subs.length > 0) setExistingSubImgs(subs.map(s => ({ imageId: s.imageId, url: s.imageSavedName })))
      })
  }, [])

  const handleFormChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleMainImg = e => {
    const file = e.target.files[0]
    if (!file) return
    setMainImgFile(file)
    setMainImgPreview(URL.createObjectURL(file))
  }

  /** 새 서브 이미지 추가 */
  const handleSubImgs = e => {
      const files = Array.from(e.target.files)
      setNewSubImgFiles(prev => [...prev, ...files])
      setNewSubImgPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  /** 기존 서브 이미지 개별 삭제 */
  const clearExistingSubImg = (imageId) => {
      setExistingSubImgs(prev => prev.filter(img => img.imageId !== imageId))
      setDeletedSubImageIds(prev => [...prev, imageId])
  }

  /** 새 서브 이미지 개별 삭제 */
  const clearNewSubImg = (index) => {
      setNewSubImgFiles(prev => prev.filter((_, i) => i !== index))
      setNewSubImgPreviews(prev => prev.filter((_, i) => i !== index))
      if (newSubImgFiles.length === 1) subInputRef.current.value = ''
  }

  const handleDetailImg = e => {
    const file = e.target.files[0]
    if (!file) return
    setDetailImgFile(file)
    setDetailPreview(URL.createObjectURL(file))
  }

  const clearMainImg = e => {
    e.stopPropagation()
    setMainImgFile(null)
    setMainImgPreview(null)
    mainInputRef.current.value = ''
  }

  /** 서브 이미지 개별 삭제 */
  const clearSingleSubImg = (e, index) => {
    e.stopPropagation()
    const newFiles    = subImgFiles.filter((_, i) => i !== index)
    const newPreviews = subImgsPreviews.filter((_, i) => i !== index)
    setSubImgFiles(newFiles)
    setSubImgsPreviews(newPreviews)
    if (newFiles.length === 0) subInputRef.current.value = ''
  }

  const clearDetailImg = e => {
    e.stopPropagation()
    setDetailImgFile(null)
    setDetailPreview(null)
    detailInputRef.current.value = ''
  }

  const validate = () => {
    const newErrors = {}
    if (!form.productName.trim()) newErrors.productName  = '상품명을 입력해주세요'
    if (!form.productPrice)       newErrors.productPrice  = '가격을 입력해주세요'
    if (!form.productStock)       newErrors.productStock  = '재고를 입력해주세요'
    if (!form.categoryId)         newErrors.categoryId    = '카테고리를 선택해주세요'
    if (!form.productStatus)      newErrors.productStatus = '상품 상태를 선택해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    console.log('[수정저장] deletedSubImageIds:', deletedSubImageIds)
    if (newSubImgFiles.length > 0){
      setIsLoading(true)
    }
    try {
      const mainImgUrl   = mainImgFile   ? await uploadImageToS3(mainImgFile)                        : null
      const detailImgUrl = detailImgFile ? await uploadImageToS3(detailImgFile)                      : null
      const subImgUrls   = newSubImgFiles.length > 0 ? await Promise.all(newSubImgFiles.map(uploadImageToS3)) : null

      await putProduct(product.productId, form, mainImgUrl, subImgUrls, detailImgUrl, deletedSubImageIds)
      onSuccess()
      onClose()
    } catch (e) {
      setSubmitError(true)
      setTimeout(() => setSubmitError(false), 3000)
    } finally {
      setIsLoading(false);
      showToast("수정을 완료했습니다");
    }

  }

  const STATUS_OPTIONS = [
    { value: 'ACTIVE',   label: '판매중' },
    { value: 'INACTIVE', label: '판매중지' },
  ]

  return (
    <div>
      {submitError && (
        <div className={`${styles.toast} ${styles.toastError}`}>
          수정 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}

      <div className={styles.layout}>
        {/* 좌측 - 이미지 영역 */}
        <div className={styles.imageCol}>

          <div className={styles.imgSection}>
            <p className={styles.imgLabel}>
              대표 이미지 <span className={styles.required}>*</span>
            </p>
            <div
              className={`${styles.uploadBox} ${styles.mainBox}`}
              onClick={() => mainInputRef.current.click()}
            >
              {mainImgPreview
                ? <>
                    <img src={mainImgPreview} alt='대표 이미지' className={styles.previewImg} />
                    <button className={styles.clearBtn} onClick={clearMainImg}>✕</button>
                  </>
                : <div className={styles.placeholder}>
                    <span className={styles.uploadIcon}>+</span>
                    <span>클릭하여 이미지 선택</span>
                  </div>
              }
            </div>
            <input ref={mainInputRef} type='file' accept='image/*' hidden onChange={handleMainImg} />
          </div>

          <div className={styles.imgSection}>
            <p className={styles.imgLabel}>서브 이미지 <span className={styles.optional}>(선택)</span></p>

            {/* 이미지 그리드: uploadBox 밖으로 분리해 이벤트 충돌 제거 */}
            {(existingSubImgs.length > 0 || newSubImgPreviews.length > 0) && (
              <div className={styles.subGrid}>
                {existingSubImgs.map(img => (
                  <div key={img.imageId} className={styles.subImgWrap}>
                    <img src={img.url} alt='서브' className={styles.subPreviewImg} />
                    <button type="button" className={styles.clearBtnSub} onClick={() => clearExistingSubImg(img.imageId)}>✕</button>
                  </div>
                ))}
                {newSubImgPreviews.map((url, i) => (
                  <div key={`new-${i}`} className={styles.subImgWrap}>
                    <img src={url} alt={`새 서브${i + 1}`} className={styles.subPreviewImg} />
                    <button type="button" className={styles.clearBtnSub} onClick={() => clearNewSubImg(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* 파일 업로드 트리거 박스 */}
            <div className={styles.uploadBox} onClick={() => subInputRef.current.click()}>
              <div className={styles.placeholder}>
                <span className={styles.uploadIcon}>+</span>
                <span>여러 장 선택 가능</span>
              </div>
            </div>

            <input ref={subInputRef} type='file' accept='image/*' multiple hidden onChange={handleSubImgs} />
          </div>

          <div className={styles.imgSection}>
            <p className={styles.imgLabel}>상세페이지 이미지 <span className={styles.optional}>(선택)</span></p>
            <div className={styles.uploadBox} onClick={() => detailInputRef.current.click()}>
              {detailPreview
                ? <>
                    <img src={detailPreview} alt='상세페이지' className={styles.previewImg} />
                    <button className={styles.clearBtn} onClick={clearDetailImg}>✕</button>
                  </>
                : <div className={styles.placeholder}>
                    <span className={styles.uploadIcon}>+</span>
                    <span>클릭하여 이미지 선택</span>
                  </div>
              }
            </div>
            <input ref={detailInputRef} type='file' accept='image/*' hidden onChange={handleDetailImg} />
          </div>

        </div>

        {/* 우측 - 폼 영역 */}
        <div className={styles.formCol}>
          <Input
            label='상품명'
            name='productName'
            value={form.productName}
            onChange={handleFormChange}
            required
            error={errors.productName}
          />
          <div className={styles.row}>
            <Input label='가격' type='number' name='productPrice' value={form.productPrice} onChange={handleFormChange} required error={errors.productPrice} />
            <Input label='재고' type='number' name='productStock' value={form.productStock} onChange={handleFormChange} required error={errors.productStock} />
          </div>
          <div className={styles.row}>
            <Select
              label='카테고리'
              name='categoryId'
              value={form.categoryId}
              onChange={handleFormChange}
              options={cateList.map(c => ({ value: c.categoryId, label: c.categoryName }))}
              required
              error={errors.categoryId}
            />
            <Select
              label='상품 상태'
              name='productStatus'
              value={form.productStatus}
              onChange={handleFormChange}
              options={STATUS_OPTIONS}
              required
              error={errors.productStatus}
            />
          </div>
          <div className={styles.textareaGroup}>
            <Textarea
              label='상품 설명'
              name='productDesc'
              value={form.productDesc}
              onChange={handleFormChange}
              placeholder='상품 설명을 입력해주세요'
              rows={5}
            />
          </div>
          <Button 
            fullWidth 
            onClick={handleSave}
            type='button'
            disabled={isLoading}
          >{isLoading ? '수정 중...' : '수정'}</Button>
        </div>
      </div>
    </div>
  )
}

export default ProductEditModal
