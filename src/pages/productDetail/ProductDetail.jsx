import './productDetail.scss'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IMAGE_LINK, request } from '../../requestMethod';
import { useDispatch, useSelector } from 'react-redux';
import { numberWithCommas } from '../../utils/formatMoney';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toastOption } from '../../constants';
import { Button, Divider, Modal, Rate } from 'antd';
import { useInsertUpdateCart } from '../../services/products';
import Review from '../../components/Review/Review';
import { useGetFeedbackProduct } from '../../services/feedback';

export default function ProductDetail() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const [countSold, setCountSold] = useState(0);
    const id = location.pathname.split("/")[2];
    const [avatar, setAvatar] = useState("")
    const currentUser = useSelector((state) => state.user.currentUser);
    const [information, setInformation] = useState({
        product: {},
        listColor: [],
        listSize: [],
        listImg: []
    })
    const [detailProduct, setDetailProduct] = useState({})
    const [size, setSize] = useState(null)
    const [color, setColor] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false);


    const { feedbackListProduct } = useGetFeedbackProduct(id)
    const serviceInsertUpdateCart = useInsertUpdateCart()
    const showModal = () => {
        setIsModalOpen(true);
    };

    const caculatorRateValue = useMemo(() => {
        const total = feedbackListProduct.reduce((accumulator, currentValue) => accumulator + currentValue.rate,
            0,)
        return feedbackListProduct.length > 0 ? total / feedbackListProduct.length : 5
    }, [feedbackListProduct.length])



    const handleOk = () => {
        navigate("/login")
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        const getProductDetail = async () => {
            try {
                const res = await request.get(`/product/detail/${id}`)
                const result = await request.get(`/stat/sold/${id}`)
                setCountSold(result.data.total_quantity)
                setInformation({
                    ...information,
                    product: res.data.product,
                    listColor: res.data.colors,
                    listSize: res.data.sizes,
                    listImg: res.data.colors.map((color) => {
                        return { id: color.id, img: color.img }
                    })
                })
                setAvatar(res.data.product.img)
            } catch (error) {
                console.log(error);
            }
        }
        getProductDetail()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
    useEffect(() => {
        const getPriceByOption = async () => {
            try {
                const res = await request.get(`/filter/details?idpro=${id}&size=${size}&color=${color}`)
                setDetailProduct(res.data.detail)
            } catch (error) {

            }
        }
        color && size && getPriceByOption()
    }, [color, size, id])
    useEffect(() => {
        const handleChangeColor = async () => {
            try {
                const res = await request.get(`/filter/searchsize?color=${color}&idpro=${id}`)
                setInformation({
                    ...information,
                    listSize: res.data.sizes
                })
            } catch (error) {
                console.log(error);
            }
        }
        color && handleChangeColor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color, id])

    useEffect(() => {
        const handleChangeSize = async () => {
            try {
                const res = await request.get(`/filter/searchcolor?size=${size}&idpro=${id}`)
                // console.log('color:',res.data.colors);
                setInformation({
                    ...information,
                    listColor: res.data.colors
                })
            } catch (error) {
                console.log(error);
            }
        }
        size && handleChangeSize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, size])
    const handleChangeQuantityOrder = (action) => {
        if (action === "increase") {
            if (quantity < detailProduct.quantity) {
                setQuantity(prev => prev + 1)
            }
        } else if (action === "reduce") {
            if (quantity > 1) {
                setQuantity(prev => prev - 1)
            }
        }
    }
    useEffect(() => {
        if (detailProduct.quantity < 1) {
            setQuantity(0)
        } else {
            setQuantity(1)
        }
    }, [detailProduct.quantity])


    const handleAddToCart = async () => {
        if (!currentUser) {
            showModal()
            return;
        }
        if (!size || !color) {
            toast.error('Vui lòng chọn loại sản phẩm !', toastOption);
            return;
        } else if (quantity < 1) {
            toast.error('Rất tiếc, sản phẩm này hiện đã hết hàng :(((', toastOption);
            return;
        }
        else if (quantity > detailProduct.quantity) {
            toast.error('Rất tiếc, sản phẩm này không đủ số lượng :(((', toastOption);
            return;
        }
        if (size && color && quantity > 0) {
            serviceInsertUpdateCart.mutateAsync({
                filter: detailProduct.id,
                quantity: quantity
            })

        }
    }
    const handleBuyNow = () => {
        if (!currentUser) {

            showModal()
            return;
        }
        if (!size || !color) {
            toast.error('Vui lòng chọn màu sắc, dung lượng !', toastOption);
            return;
        } else if (quantity < 1) {
            toast.error('Rất tiếc, sản phẩm này hiện đã hết hàng :(((', toastOption);
            return;
        }
        else if (quantity > detailProduct.quantity) {
            toast.error('Rất tiếc, sản phẩm này không đủ số lượng :(((', toastOption);
            return;
        }
        if (size && color && quantity > 0) {
            handleAddToCart()
            navigate("/cart")
        } else if (quantity < 1) {
            toast.error("Xin lỗi! Sản phẩm này đã hết :((", toastOption);
        } else {
            toast.error("Bạn vui lòng chọn màu sắc và số lượng !", toastOption);
        }
    }
    const formatPrice = () => {
        if (detailProduct.price) {
            //console.log(detailProduct.price);
            return numberWithCommas(detailProduct.price)
        } else if (information.product.priceRange) {
            //console.log(information.product.priceRange);
            return numberWithCommas(information.product.priceRange)
        }
        return 3
    }

    return (
        <>

            <Modal title="Bạn vui lòng đăng nhập để thực hiện chức năng này" open={isModalOpen} onOk={handleOk}
                onCancel={handleCancel}
                footer={[
                    <Button key="back" onClick={handleCancel}>
                        Hủy
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleOk}>
                        Đăng nhập
                    </Button>,
                ]}>

            </Modal>
            {
                information.product && (
                    <div className="productDetail-wrapper">
                        <div className="productDetail-container">
                            <div className="left">
                                <div className="main-img" style={{ backgroundImage: `url(${IMAGE_LINK}/${avatar})` }}></div>
                                <div className="list-img">
                                    {information.listImg.map(image => (
                                        <div key={image.id} className="img-item" onMouseEnter={() => setAvatar(image.img)}>
                                            <div className="img-item-content" style={{ backgroundImage: `url(${IMAGE_LINK}/${image.img})` }}>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="right">
                                <div className="heading">
                                    <div className="name-product">
                                        {information.product.name}
                                    </div>
                                    <div className="info-product">
                                        <div className="star">
                                            <div className="star-number">{caculatorRateValue}</div>
                                            <div className="list-star">
                                                <Rate allowHalf disabled value={caculatorRateValue} />

                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-item-number">
                                                {feedbackListProduct.length}
                                            </div>
                                            <div className="info-item-title">
                                                Đánh giá
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-item-number">
                                                {countSold ? countSold : 0}
                                            </div>
                                            <div className="info-item-title">
                                                Đã bán
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="price-product">
                                    {formatPrice()}
                                    {/* đ {detailProduct.price || information.product.priceRange} */}
                                </div>
                                <div className="main">
                                    <div className="main-row">
                                        <div className="row-title">
                                            Tình trạng
                                        </div>
                                        {information.product.status}
                                    </div>
                                    <div className="main-row">
                                        <div className="row-title">
                                            Bảo Hiểm
                                        </div>
                                        Bảo hiểm thiết bị di động nâng cao
                                    </div>
                                    <div className="main-row">
                                        <div className="row-title">
                                            Color
                                        </div>
                                        <div className="row-list-option">
                                            {information.listColor.map((cl) => (
                                                <div
                                                    key={cl.id}
                                                    className={color === cl.color ? "option-item active" : "option-item"}
                                                    onClick={() => setColor(cl.color)}
                                                    onMouseEnter={() => setAvatar(cl.img)}
                                                >
                                                    {cl.color}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="main-row">
                                        <div className="row-title">
                                            Size
                                        </div>
                                        <div className="row-list-option">
                                            {information.listSize.map((sz) => (
                                                <div
                                                    key={sz.id}
                                                    className={size === sz.size ? "option-item active" : "option-item"}
                                                    onClick={() => setSize(sz.size)}
                                                >
                                                    {sz.size}
                                                </div>
                                            ))}

                                        </div>
                                    </div>
                                    <div className="main-row">
                                        <div className="row-title">
                                            Số lượng
                                        </div>
                                        <div className="main-row-content">
                                            <div className="row-content-left">
                                                <div className="btn-icon" onClick={() => handleChangeQuantityOrder("reduce")}>
                                                    -
                                                </div>
                                                <input
                                                    type="text"
                                                    className='input-number'
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                                />
                                                <div className="btn-icon" onClick={() => handleChangeQuantityOrder("increase")}>
                                                    +
                                                </div>
                                            </div>
                                            <div className="row-content-right">
                                                {detailProduct.quantity ?
                                                    `${detailProduct.quantity} sản phẩm có sẵn`
                                                    : detailProduct.quantity < 1 && "Đã hết hàng"
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bottom-productDetail">
                                    <div className='btn add-cart' onClick={handleAddToCart}>
                                        <AddShoppingCartIcon />
                                        Thêm vào giỏ hàng
                                    </div>
                                    <div className='btn buy-now' onClick={handleBuyNow}>
                                        Mua ngay
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Divider orientation="center">Chi tiết sản phẩm</Divider>
                        <p style={{ padding: 20 }}>
                            {information.product.information}
                        </p>
                        <Divider orientation="center">Đánh giá sản phẩm</Divider>
                        <Review feedbackListProduct={feedbackListProduct} />
                    </div>
                )
            }

        </>
    )
}
