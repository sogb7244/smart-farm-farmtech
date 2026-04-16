import React, { useEffect, useRef, useState } from 'react'
import { getCategory, regProductAPI } from '../../../api/product/product'
import Input from '../../common/Input'
import Button from '../../common/Button'
import Select from '../../common/Select'
import styles from '../../../pages/manager/ProductRegister.module.css'
import Textarea from '../../common/Textarea'
import { uploadImageToS3 } from '../../../api/product/upload'
import useAuthStore from '../../../store/authStore'

/**
 * 상품 등록 모달 컴포넌트
 *
 * @param {function} onClose   - 모달 닫기 함수
 * @param {function} onSuccess - 등록 성공 후 부모 목록 갱신 콜백
 */
const ProductRegisterModal = ({ onClose, onSuccess }) => {
  const [cateList, setCateList] = useState([])

  const [productData, setProductData] = useState({
    productName:   '',
    productPrice:  '',
    productStock:  '',
    productDesc:   '',
    productStatus: '',
    categoryId:    1,
  })

  const [mainImg,    setMainImg]    = useState(null)
  const [subImgs,    setSubImgs]    = useState([])
  const [detailImg,  setDetailImg]  = useState(null)

  const [mainImgPreview,  setMainImgPreview]  = useState(null)
  const [subImgsPreviews, setSubImgsPreviews] = useState([])
  const [detailPreview,   setDetailPreview]   = useState(null)

  const [submitError, setSubmitError] = useState(false)
  const [errors,      setErrors]      = useState({})

  const mainInputRef   = useRef()
  const subInputRef    = useRef()
  const detailInputRef = useRef()

  const [isLoading,setIsLoading] = useState(false);
  const {showToast} = useAuthStore();

  useEffect(() => {
    getCategory()
      .then(res => setCateList(res.data))
      .catch(err => console.error('[카테고리] 조회 실패', err))
  }, [])

  /** 텍스트 필드 변경 핸들러 */
  const handleProductData = e => {
    const { value, name } = e.target
    setProductData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  /** 대표 이미지 선택 */
  const handleMainImg = e => {
    const file = e.target.files[0]
    if (!file) return
    setMainImg(file)
    setMainImgPreview(URL.createObjectURL(file))
    if (errors.mainImg) setErrors(prev => ({ ...prev, mainImg: '' }))
  }

  /** 서브 이미지 선택 (다중) */
  const handleSubImgs = e => {
    const files = Array.from(e.target.files)
    setSubImgs(files)
    setSubImgsPreviews(files.map(f => URL.createObjectURL(f)))
  }

  /** 상세페이지 이미지 선택 */
  const handleDetailImg = e => {
    const file = e.target.files[0]
    if (!file) return
    setDetailImg(file)
    setDetailPreview(URL.createObjectURL(file))
  }

  /** 필수 항목 유효성 검사 */
  const validate = () => {
    const newErrors = {}
    if (!productData.productName.trim()) newErrors.productName = '상품명을 입력해주세요'
    if (!productData.productPrice) newErrors.productPrice = '가격을 입력해주세요'
    if (!productData.productStock) newErrors.productStock = '재고를 입력해주세요'
    if (!productData.categoryId) newErrors.categoryId = '카테고리를 선택해주세요'
    if (!productData.productStatus) newErrors.productStatus = '상품 상태를 선택해주세요'
    if (!mainImg) newErrors.mainImg = '대표 이미지를 선택해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /** 폼 초기화 */
  const resetForm = () => {
    setProductData({ 
      productName: '', 
      productPrice: '', 
      productStock: '', 
      productDesc: '', 
      productStatus: '', 
      categoryId: '' 
    })
    setMainImg(null)
    setSubImgs([])
    setDetailImg(null)
    setMainImgPreview(null)
    setSubImgsPreviews([])
    setDetailPreview(null)
    mainInputRef.current.value = ''
    subInputRef.current.value = ''
    detailInputRef.current.value = ''
  }

  /** 상품 등록 */
  const regProducts = async () => {
    if (!validate()) return

    setIsLoading(true);
    try {
      const mainImgUrl = await uploadImageToS3(mainImg);
      const subImgUrls = await Promise.all(subImgs.map(uploadImageToS3));
      const detailImgUrl = detailImg ? await uploadImageToS3(detailImg) : null;
      const response = await regProductAPI(productData,mainImgUrl,subImgUrls,detailImgUrl);
      
      if(response.status === 201){
        resetForm();
        onSuccess();
        onClose()
      }
    } catch (error) {
      setSubmitError(true)
      setTimeout(() => setSubmitError(false), 3000)
    } finally {
      setIsLoading(false)
      showToast("상품 등록을 완료했습니다!")
    }

  }

  /** 대표 이미지 초기화 */
  const clearMainImg = (e) => {
    e.stopPropagation() // 업로드 박스 클릭 이벤트 방지
    setMainImg(null)
    setMainImgPreview(null)
    mainInputRef.current.value = ''
  }

  /** 서브 이미지 개별 삭제 */
  const clearSingleSubImg = (e, index) => {
    e.stopPropagation()
    const newFiles    = subImgs.filter((_, i) => i !== index)
    const newPreviews = subImgsPreviews.filter((_, i) => i !== index)
    setSubImgs(newFiles)
    setSubImgsPreviews(newPreviews)
    if (newFiles.length === 0) subInputRef.current.value = ''
  }

  /** 상세페이지 이미지 초기화 */
  const clearDetailImg = (e) => {
    e.stopPropagation()
    setDetailImg(null)
    setDetailPreview(null)
    detailInputRef.current.value = ''
  }

  return (
    <div>
      {/* 등록 실패 토스트 */}
      {submitError && (
        <div className={`${styles.toast} ${styles.toastError}`}>
          상품 등록에 실패했습니다. 다시 시도해주세요.
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
              className={`${styles.uploadBox} ${styles.mainBox} ${errors.mainImg ? styles.uploadBoxError : ''}`}
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
            {errors.mainImg && <span className={styles.errorMsg}>{errors.mainImg}</span>}
            <input ref={mainInputRef} type='file' accept='image/*' hidden onChange={handleMainImg} />
          </div>

          <div className={styles.imgSection}>
            <p className={styles.imgLabel}>서브 이미지 <span className={styles.optional}>(선택)</span></p>
            <div className={styles.uploadBox} onClick={() => subInputRef.current.click()}>
              {subImgsPreviews.length > 0
                ? <>
                    <div className={styles.subGrid}>
                      {subImgsPreviews.map((url, i) => (
                        <div key={i} className={styles.subImgWrap}>
                          <img src={url} alt={`서브${i + 1}`} className={styles.subPreviewImg} />
                          <button className={styles.clearBtnSub} onClick={(e) => clearSingleSubImg(e, i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </>
                : <div className={styles.placeholder}>
                    <span className={styles.uploadIcon}>+</span>
                    <span>여러 장 선택 가능</span>
                  </div>
              }
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
            value={productData.productName}
            onChange={handleProductData}
            placeholder='상품명을 입력해주세요'
            required
            error={errors.productName}
          />
          <div className={styles.row}>
            <Input
              label='가격'
              name='productPrice'
              type='number'
              value={productData.productPrice}
              onChange={handleProductData}
              placeholder='0'
              required
              error={errors.productPrice}
            />
            <Input
              label='재고'
              name='productStock'
              type='number'
              value={productData.productStock}
              onChange={handleProductData}
              placeholder='0'
              required
              error={errors.productStock}
            />
          </div>
          <div className={styles.row}>
            <Select
              label='카테고리'
              name='categoryId'
              value={productData.categoryId}
              onChange={handleProductData}
              options={cateList.map(c => ({ value: c.categoryId, label: c.categoryName }))}
              placeholder='카테고리 선택'
              required
              error={errors.categoryId}
            />
            <Select
              label='상품 상태'
              name='productStatus'
              value={productData.productStatus}
              onChange={handleProductData}
              options={[
                { value: 'ACTIVE',   label: '판매중' },
                { value: 'INACTIVE', label: '판매중지' },
              ]}
              placeholder='상태 선택'
              required
              error={errors.productStatus}
            />
          </div>
          <div className={styles.textareaGroup}>
            <Textarea
              name='productDesc'
              value={productData.productDesc}
              onChange={handleProductData}
              placeholder='상품 설명을 입력해주세요'
              className={styles.textarea}
              rows={5}
            />
          </div>
          <Button fullWidth
           onClick={regProducts}
           className={isLoading && styles.btnReg}
           disabled={isLoading}
          >{isLoading ? '등록 중...' : '상품 등록'}</Button>
        </div>
      </div>
    </div>
  )
}

export default ProductRegisterModal
