// Generated from Hub/brand/footer.template.tsx and apps.json. Edit the originals.
const HUB = 'https://www.tskool.kr';
const APP_NAME = "T맞춤정보";

// Scoped styles keep the Hub layout identical in Tailwind and plain-CSS apps.
const footerStyles = `
.tskool-footer{box-sizing:border-box;width:100%;border-top:1px solid #e5e7eb;background:#f9fafb;color:#0c0a09;padding:24px 0;font-family:"Pretendard Variable",Pretendard,Inter,"Noto Sans KR","Noto Color Emoji",sans-serif;line-height:1.5;text-align:left}
.tskool-footer *{box-sizing:border-box}
.tskool-footer a{color:inherit;text-decoration:none}
.tskool-footer a:hover{color:#f97316}
.tskool-footer-inner{width:100%;max-width:1024px;margin:0 auto;padding:0 24px}
.tskool-footer-grid{display:grid;grid-template-columns:1fr;align-items:start;gap:24px}
.tskool-footer-brand{display:flex;flex-direction:column;align-items:center;gap:12px;font-size:16px;font-weight:600}
.tskool-footer-brand img{display:block;width:64px;height:auto;border-radius:12px}
.tskool-footer-details{display:flex;flex-direction:column;gap:12px;text-align:center;min-width:0}
.tskool-footer-business{display:flex;flex-direction:column;gap:4px;font-size:12px;color:rgba(12,10,9,.7);overflow-wrap:anywhere}
.tskool-footer-links{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 16px;padding-top:4px;font-size:14px;font-weight:500}
.tskool-footer-links a:last-child{color:#f97316;font-weight:700}
.tskool-footer-links a:last-child:hover{text-decoration:underline}
.tskool-footer-social{display:flex;justify-content:center;gap:16px}
.tskool-footer-social a{display:block;transition:transform .15s}
.tskool-footer-social a:hover{transform:scale(1.1)}
.tskool-footer-social img,.tskool-footer-instagram{display:flex;width:40px;height:40px;border-radius:8px;align-items:center;justify-content:center}
.tskool-footer-instagram{background:linear-gradient(to top right,#feda75,#d62976,#4f5bd5);color:white}
.tskool-footer-instagram svg{width:20px;height:20px}
.tskool-footer-copyright{margin-top:16px;border-top:1px solid #e5e7eb;padding-top:12px;text-align:center;font-size:12px;color:rgba(12,10,9,.5)}
@media(min-width:640px){.tskool-footer{padding:32px 0}.tskool-footer-grid{grid-template-columns:auto 1fr auto;gap:40px}.tskool-footer-brand{align-items:flex-start;font-size:18px}.tskool-footer-brand img{width:80px}.tskool-footer-business{font-size:14px}.tskool-footer-social{justify-content:flex-end}}
.dark .tskool-footer{background:rgba(17,24,39,.5);color:#f9fafb;border-color:#374151}.dark .tskool-footer-business,.dark .tskool-footer-copyright{color:#9ca3af}.dark .tskool-footer-copyright{border-color:#374151}
`;

export const Footer = () => (
  <footer className="tskool-footer">
    <style>{footerStyles}</style>
    <div className="tskool-footer-inner">
      <div className="tskool-footer-grid">
        <div className="tskool-footer-brand">
          <img src={`${HUB}/logo.png`} alt="T스쿨 로고" width={80} height={80} />
          <span>{APP_NAME}</span>
        </div>
        <div className="tskool-footer-details">
          <div className="tskool-footer-business">
            <span>사업체명 (주)거북스쿨 | 대표 강준호</span>
            <span>사업자등록번호 772-87-02782 | 연락처 042-484-3356 / 010-2518-7139</span>
            <span>서울시 성북구 화랑로 211 성북구 기술창업센터 105호</span>
          </div>
          <div className="tskool-footer-links">
            <a href={`${HUB}/explain/service`} target="_blank" rel="noopener noreferrer">이용약관</a>
            <a href={`${HUB}/explain/refund`} target="_blank" rel="noopener noreferrer">환불규정</a>
            <a href={`${HUB}/explain/privacy`} target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
          </div>
        </div>
        <div className="tskool-footer-social">
          <a href="https://cafe.naver.com/turtlecorp" target="_blank" rel="noopener noreferrer" aria-label="네이버 카페">
            <img src={`${HUB}/icons/naver-cafe.png`} alt="네이버 카페" width={40} height={40} />
          </a>
          <a href="https://www.youtube.com/@turtleschool_official" target="_blank" rel="noopener noreferrer" aria-label="유튜브">
            <img src={`${HUB}/icons/youtube.png`} alt="YouTube" width={40} height={40} />
          </a>
          <a href="https://www.instagram.com/turtleschool_official/" target="_blank" rel="noopener noreferrer" aria-label="인스타그램">
            <span className="tskool-footer-instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></span>
          </a>
        </div>
      </div>
      <div className="tskool-footer-copyright">© {new Date().getFullYear()} (주)거북스쿨. All rights reserved.</div>
    </div>
  </footer>
);

export default Footer;
