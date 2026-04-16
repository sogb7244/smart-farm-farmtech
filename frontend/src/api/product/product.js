import axios from "axios";
import { axiosInstance } from "../axiosInstance";
import { uploadImageToS3 } from "./upload";

//상품 등록 api
export const regProductAPI = async(productData,mainImgUrl,subImgUrl,detailImgUrl) => {
  console.log(productData)
  console.log(mainImgUrl)

 return axiosInstance.post('/products',{
  ...productData,
  mainImgUrl,
  subImgUrl,
  detailImgUrl
 })
}

//카테고리 조회 api
export const getCategory = async() => {
  try{
    const reponse = await axiosInstance.get('/products/category')
    return reponse;
  } catch(e){
     console.log('상품 등록 시 카테고리 axios 오류',e)
  }
}

/**
 * 상품 목록 조회 API
 * GET /products
 * V_PRODUCT_LIST VIEW 기반으로 ACTIVE 상태의 상품 목록과 대표 이미지를 반환
 * @param {string|null} sort - 정렬 기준 (sales_desc / price_desc / price_asc / null: 기본값)
 * @returns {Promise<Array>} 상품 목록 배열
 */
export const getProductList = async (sort = null, keyword = null, categoryId = null) => {
  const response = await axiosInstance.get('/products', {
    params: { sort, keyword, categoryId }
  })
  return response.data
}
/**
 * 해당 번호의 상품 상세 조회
 * @param {*} productId 
 * @returns 
 */
export const getProduct = async (productId) => {
  const response = await axiosInstance.get(`/products/${productId}`)
  return response
}

/**
 * 카트에 상품 담기
 * @param {*} item 
 * @returns 
 */
export const insertCartItem = async (item) => {
  const response = await axiosInstance.post('/carts', item)
  return response
}

/**
 * 카트에 담긴 상품 조회
 * @returns 
 */
export const getCartItems = async () => {
  const response = await axiosInstance.get('/carts/items')
  return response
}

/**
 * 카트에 담긴 상품 수량 변경
 * @param {*} data 
 * @returns 
 */
export const putCnt = async (data) => {
  const response = await axiosInstance.put('/carts/cnt', data)
  return response
}

/**
 * 카트 선택 상품 삭제
 * @param {*} idList 
 * @returns 
 */
export const deleteItem = async (idList) => {
  const response = await axiosInstance.delete('/carts/item', {data : idList})
  return response
}

/**
 * 카트 전체 상품 삭제
 * @returns 
 */
export const deleteAllItem = async () => {
  const response = await axiosInstance.delete('/carts/all')
  return response
}

/**
 * 주문 정보 저장 
 * @param {} data 
 * @returns 
 */
export const insertOrder = async (data) => {
  const response = await axiosInstance.post('/orders', data)
  return response
}

/**
 * 매니저 상품 전체 목록 조회 (필터 + 페이지네이션)
 * GET /products/manager
 * @param {Object} params - { categoryId, status, keyword, page, size }
 */
export const getProductListManager = async (params = {}) => {
  const response = await axiosInstance.get('/products/manager', { params })
  return response
}

/**
 * PUT /products/{productId}
 * @returns 상품 수정
 */
export const putProduct = async(productId, productData, mainImgUrl, subImgUrls, detailImgUrl, deleteImgIds) => {
  const response = await axiosInstance.put(`/products/${productId}`, {
    ...productData,
    mainImgUrl,
    subImgUrls,
    detailImgUrl,
    deleteImgIds
  })
  return response;
}

/**
 * DELETE /products/{productId}
 * @returns 상품 삭제
 */
export const delProduct = async(productId) => {
  const response = await axiosInstance.delete(`/products/${productId}`)
  return response;
}

export const getOrder = async () => {
  const response = await axiosInstance.get('/orders')
  return response
}

/**
 * 내 주문 내역
 * @param {*} startDate
 * @param {*} endDate
 * @returns
 */
export const getOrderList = async (startDate, endDate) => {
    const response = await axiosInstance.get('/orders/list', {
        params: { startDate, endDate }
    })
    return response

}

/**
 * 상품별 리뷰 조회
 * @param {*} productId 
 * @returns 
 */
export const getProductReviews = async (productId) => {
  const response = await axiosInstance.get(`/reviews/product/${productId}`)
  return response
}

/**
 * 리뷰 평균, 수, 별점 별 갯수 조회
 * @param {*} productId 
 * @returns 
 */
export const getReviewStats = async (productId) => {
  const response = await axiosInstance.get('/reviews/all', {
    params: { productId }
  })
  return response
}

/**
 * 추천 검색어 조회
 * @returns 
 */
export const getRecommendedKeywords = () => axiosInstance.get('/products/recommended-keywords')
