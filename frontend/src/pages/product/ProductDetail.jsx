import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './ProductDetail.module.css'
import { getProduct, insertCartItem } from '../../api/product/product';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Button from '../../components/common/Button'
import { decodeToken } from '../../utils/tokenUtils';

const ProductDetail = () => {
  const nav = useNavigate();
  const {productId} = useParams();

  const decoded = decodeToken(localStorage.getItem('token'))
  const memEmail = decoded.sub

  //상품 상세 정보 저장 state 변수
  const [product, setProduct] = useState({})

  //상품 수량 저장 state변수
  const [cnt, setCnt] =useState(1);

  //수량 변경 시 실행함수
  const handleCnt = e => {
    //만약 숫자가 아닌 문자열이 입력되면 입력된 문자열을 빈문자열로 변경
    let cntValue = e.target.value.replace(/[^0-9]/g, '')
    cntValue = cntValue === '' ? '1' : Number(cntValue)
    if(cntValue > 99) {
      cntValue = 99
      alert('최대 구매 수량은 99개입니다.')
    }
    setCnt(cntValue)
  }

  //-버튼 클릭시
  const minusCnt = e => {
    setCnt(prev => prev <= 1 ? 1 : prev -1) 
  }
  //+버튼 클릭시
  const plusCnt = e => {
    setCnt(prev => prev >= 99 ? 99 : prev + 1)
    if(cnt >= 99) {
      alert('최대 구매 수량은 99개입니다.')
      return
    }
  }

  //상품 조회 및 저장된 이미지이름 저장 함수
  const getProductDetail = async () => {
    const response = await getProduct(productId);
    setProduct(response.data)
    for(let e of response.data.productImageList){
      if(e.imageType === 'MAIN'){
        setMainImg(e.imageSavedName)
      }
      if(e.imageType === 'SUB'){
        setSubImg(e.imageSavedName)
      }
      if(e.imageType === 'DETAIL'){
        setDetailImg(e.imageSavedName)
      }
    }
  }

  //메인이미지 저장 state변수
  const [mainImg, setMainImg] = useState('')
  //서브이미지 저장 state변수
  const [subImg, setSubImg] = useState('')
  //상세이미지 저장 state변수
  const [detailImg, setDetailImg] = useState('')
  
  useEffect(()=>{
    getProductDetail()
  }, [])

  //장바구니 담기 버튼 클릭 시 실행함수
  const addCartItem = async () => {
    const cartItem = {
      productId : product.productId,
      cartItemQty : cnt
    }
    const response = await insertCartItem(cartItem)
    if(response.status === 200){
      alert('장바구니 저장 완료')
    }
    else{
      alert('실패')
    }
  }

  console.log(product)


  return (
    <div className={styles.container}>
      <div className={styles.product_div}>
        <div className={styles.img_div}>
          <Swiper
            modules={[Pagination, Navigation]}
            pagination={{ clickable:true}}
            navigation
            loop
          >
            <SwiperSlide className={styles.imageWrapper}>
              <img 
                src={mainImg}
                className={styles.image}  
              />
            </SwiperSlide>
          </Swiper>
        </div>
        <div className={styles.detail_div}>
          <div>{product?.productName}</div>
          <div className={styles.price_cnt}>
            <div className={styles.price_div}>
              <p>판매가격</p>
              <p className={styles.price}>{product.productPrice?.toLocaleString()}원</p>
            </div>
            <div className={styles.cnt_div}>
              <p>수량</p>
              <div>
                <button
                  onClick={e => minusCnt(e)}
                >-</button>
                <input 
                  type="text" 
                  name='cnt'
                  value={cnt}
                  onChange={e => handleCnt(e)}  
                />
                <button
                  onClick={e => plusCnt(e)}
                >+</button>
              </div>
            </div>
          </div>
          <div className={styles.total_cnt}>
            <p>총 구매 가격 : </p>
            <p>{(product.productPrice*cnt)?.toLocaleString()}원</p>
          </div>
          <div className={styles.btn_div}>
            <Button
              variant='success'
            >
              바로 구매
            </Button>
            <Button
              onClick={e => addCartItem()}
            >
              장바구니
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail