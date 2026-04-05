import React, { useEffect, useState } from 'react'
import styles from './Cart.module.css'
import Table from '../../components/common/Table'
import { getCartItems, putCnt } from '../../api/product/product'
import Button from '../../components/common/Button'
import { MdPayment } from "react-icons/md";

const Cart = () => {
  //카트 리스트 저장 state 변수
  const [cartItem, setCartItem] = useState([])

  //카트 리스트 조회 함수
  const getCart = async () => {
    const response = await getCartItems();

    const dataList = response.data.map((item, index) => {
      return {
        cartItemId : item.cartItemDTOList[0].cartItemId,
        productName : item.cartItemDTOList[0].product.productName,
        productPrice : item.cartItemDTOList[0].product.productPrice,
        cartItemQty : item.cartItemDTOList[0].cartItemQty,
        img : item.cartItemDTOList[0].product.productImageList[0].imageSavedName
      }
    })
    setCartItem(dataList)
    setCheckedItems(dataList.map(item => item.cartItemId))
  }

  useEffect(()=>{
    getCart()
  },[])

  //수량과 카트번호 저장 state변수
  const [cntAndCartNum, setCntAndCartNum] = useState({
    cartItemQty : 0,
    cartItemId : 0
  })

  //수량 변경 시 실행함수
  const handleCnt = (e, item) => {
    //만약 숫자가 아닌 문자열이 입력되면 입력된 문자열을 빈문자열로 변경
    let cntValue = e.target.value.replace(/[^0-9]/g, '')
    cntValue = cntValue === '' ? '1' : Number(cntValue)
    if(cntValue > 99) {
      cntValue = 99
      alert('최대 구매 수량은 99개입니다.')
    }
    setCntAndCartNum({
      cartItemQty : cntValue,
      cartItemId : item.cartItemId
    })
  }

  // -버튼 클릭시
  const minusCnt = (e, item) => {
    setCntAndCartNum({
      cartItemQty : item.cartItemQty - 1,
      cartItemId : item.cartItemId
    })
  }
  //+버튼 클릭시
  const plusCnt = (e, item) => {
    setCntAndCartNum({
      cartItemQty : item.cartItemQty + 1,
      cartItemId : item.cartItemId
    })
  }

  //수량 변경 db 저장 함수
  const updateCnt = async (data) => {
    await putCnt(data)
  }
  // 수량 변경시 db 업데이트 후 렌더링
  useEffect(()=>{
    if (cntAndCartNum.cartItemId === 0) return
    const update = async () => {
    await updateCnt(cntAndCartNum)
    await getCart()
  }
  update()
  }, [cntAndCartNum])

   //체크박스 선택시 카트번호가 저장될 state변수
  const [checkedItems, setCheckedItems] = useState([]);
  
  //전체 체크박스 state변수
  const [isChecked, setIsChecked] = useState(true); 

   //체크 박스 클릭 시 실행할 함수
  const checkItem = (e) => {
  let newChecked
    if (e.target.checked) {
      newChecked = [...checkedItems, Number(e.target.value)]
    } else {
      newChecked = checkedItems.filter(data => data !== Number(e.target.value))
    }
    setCheckedItems(newChecked)
    // 전체 선택됐는지 자동으로 반영
    setIsChecked(newChecked.length === cartItem.length)
  }

  console.log(checkedItems)

  const checkAll = (e) => {
    if (e.target.checked) {
      // 전체 선택 → 모든 cartItemId를 checkedItems에 추가
      setCheckedItems(cartItem.map(item => item.cartItemId))
      setIsChecked(true)
    } else {
      // 전체 해제
      setCheckedItems([])
      setIsChecked(false)
    }
  }

  const headers = [
    [
      {
        label: (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={checkAll}
          />
        )
      },
      { label: '상품명' },
      { label: '가격' },
      { label: '수량' },
      { label: '합계' },
    ]
  ]

  const renderRow = (item, index) => (
    <>
      <td>
        <input
          type="checkbox"
          value={item.cartItemId}
          checked={checkedItems.includes(item.cartItemId)}
          onChange={e => checkItem(e)} 
        />
      </td>
      <td className={styles.img_name_div}>
        <img
          src = {item.img}
          className={styles.item_img}
        />
        <p>{item.productName}</p>
      </td>
      <td>{item.productPrice}원</td>
      <td>
        <div className={styles.cnt_div}>
          <button className={styles.cnt_btn} onClick={e => minusCnt(e, item)}>-</button>
          <input
            type="text"
            name='cnt'
            value={item.cartItemQty}
            onChange={e => handleCnt(e, item)}
            className={styles.cnt_input}
          />
          <button className={styles.cnt_btn} onClick={e => plusCnt(e, item)}>+</button>
        </div>
      </td>
      <td className={styles.total_price}>
        {(item.productPrice * item.cartItemQty).toLocaleString()}원
      </td>
    </>
  )

  // 총 금액이 저장될 변수
  const totalPrice = cartItem
    .filter(item => checkedItems
    .includes(item.cartItemId))
    .reduce((sum, item) => sum + item.productPrice * item.cartItemQty, 0)

  // 주문하기 버튼 클릭 함수
  const goOrder = () => {
    const data = {
      'orderDTO' : {},
      'orderItemDTOList' : []
    }


  }

  return (
    <div className={styles.container}>
      <Table
        headers={headers}
        data={cartItem}
        renderRow={renderRow}
        className={styles.cart_table}
      />
      <div className={styles.delete_totalPrice_div}>
        <div className={styles.btn_div}>
          <Button>선택삭제</Button>
          <Button
            variant='danger'
          >전체삭제</Button>
        </div>
        <div className={styles.totalPrice_div}>
          <p>총 결제금액 : </p>
          <p>{totalPrice.toLocaleString()}원</p>
        </div>
      </div>
      <div className={styles.order_div}>
        <Button
          variant='success'
        ><MdPayment />  주문하기</Button>
      </div>
    </div>
  )
}

export default Cart
