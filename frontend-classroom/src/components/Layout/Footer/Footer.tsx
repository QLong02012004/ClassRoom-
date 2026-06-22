import React from "react";
import { Link } from "react-router-dom";
/* import { logo } from "../../../assets/images/img";
 */import {
    FacebookLogo,
    InstagramLogo,
    TwitterLogo,
    YoutubeLogo,
    MapPin,
    PhoneCall,
    EnvelopeSimple,
    PaperPlaneRight,
} from "phosphor-react";
import styles from "./Footer.module.scss";

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerGrid}>
                    {/* Column 1: Brand */}
                    <div
                        className={styles.footerCol}
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        {/* <Link to="/" className={styles.logo} title="Trang chủ TravelAI" aria-label="Quay về trang chủ TravelAI">
              <div className={styles.logoIcon}>
                <img
                  src={logo}
                  alt="AI Travel Planner Logo"
                  className={styles.logoImg}
                />
              </div>
            </Link> */}
                        <p className={styles.footerDesc}>
                            Nền tảng du lịch thông minh, giúp bạn tạo lịch trình cá nhân hóa
                            nhanh chóng và dễ dàng bằng sức mạnh của AI.
                        </p>
                        <div className={styles.footerSocials}>
                            <a href="" className={styles.socialIcon} title="Facebook" aria-label="Theo dõi chúng tôi trên Facebook">
                                <FacebookLogo weight="fill" />
                            </a>
                            <a href="#" className={styles.socialIcon} title="Instagram" aria-label="Theo dõi chúng tôi trên Instagram">
                                <InstagramLogo weight="fill" />
                            </a>
                            <a href="#" className={styles.socialIcon} title="Twitter" aria-label="Theo dõi chúng tôi trên Twitter">
                                <TwitterLogo weight="fill" />
                            </a>
                            <a href="#" className={styles.socialIcon} title="Youtube" aria-label="Theo dõi chúng tôi trên Youtube">
                                <YoutubeLogo weight="fill" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Links */}
                    <div
                        className={styles.footerCol}
                        data-aos="fade-up"
                        data-aos-delay="200"
                    >
                        <h4 className={styles.footerHeading}>Khám phá</h4>
                        <ul className={styles.footerLinksList}>
                            <li>
                                <Link to="/itinerary">Lộ trình</Link>
                            </li>
                            <li>
                                <a href="#">Địa điểm nổi bật</a>
                            </li>
                            <li>
                                <a href="#">Lịch trình mẫu</a>
                            </li>
                            <li>
                                <a href="#">Cộng đồng chia sẻ</a>
                            </li>
                            <li>
                                <a href="#">Cẩm nang du lịch</a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Contact */}
                    <div
                        className={styles.footerCol}
                        data-aos="fade-up"
                        data-aos-delay="300"
                    >
                        <h4 className={styles.footerHeading}>Liên hệ</h4>
                        <ul className={styles.footerContactList}>
                            <li>
                                <div className={styles.contactIcon}>
                                    <MapPin weight="fill" />
                                </div>
                                <span>123 Đường Du Lịch, Quận Trung Tâm, TP. HCM</span>
                            </li>
                            <li>
                                <div className={styles.contactIcon}>
                                    <PhoneCall weight="fill" />
                                </div>
                                <span>1900 1234</span>
                            </li>
                            <li>
                                <div className={styles.contactIcon}>
                                    <EnvelopeSimple weight="fill" />
                                </div>
                                <span>hello@aitravel.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Newsletter */}
                    <div
                        className={styles.footerCol}
                        data-aos="fade-up"
                        data-aos-delay="400"
                    >
                        <h4 className={styles.footerHeading}>Bản tin</h4>
                        <p className={styles.footerDesc}>
                            Đăng ký để nhận những thông tin du lịch và ưu đãi mới nhất.
                        </p>
                        <form
                            className={styles.newsletterForm}
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <input type="email" placeholder="Email của bạn" required />
                            <button type="submit" className={styles.btnSubscribe} title="Đăng ký" aria-label="Đăng ký nhận bản tin">
                                <div className={styles.footerIcon}>
                                    <PaperPlaneRight weight="bold" />
                                </div>
                            </button>
                        </form>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <div className={styles.footerBottomContent}>
                        <p>&copy; 2026 AI Travel Planner. Bảo lưu mọi quyền.</p>
                        <div className={styles.footerLegal}>
                            <a href="#">Điều khoản sử dụng</a>
                            <a href="#">Chính sách bảo mật</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
