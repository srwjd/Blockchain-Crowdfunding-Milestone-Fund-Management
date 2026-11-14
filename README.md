# InnovateFund
# สมาชิก
# 66012968 สิราวรรณ จันแดง
# 66048395 อารยา โฆษิตไกร
# 66080904 กันต์ณิษา อินตรา
# 66085170 ศิรินทร์ จันทร์ทนต์

ระบบบริหารโครงการระดมทุนและจ่ายเงินตามความสำเร็จ (Blockchain Crowdfunding & Milestone Fund Management) ตามโจทย์ที่ 5

**หน้าบ้าน:** React + Vite, ภาษาไทย, รองรับมือถือ, เผยแพร่บน GitHub Pages  
**หลังบ้าน:** Solidity Smart Contract บน Ethereum Sepolia, Compile/Deploy ด้วย Remix IDE  
**เชื่อมต่อ Blockchain:** ethers.js v6 + Wallet แบบ EIP-1193 เช่น MetaMask

เว็บ: https://srwjd.github.io/Blockchain-Crowdfunding-Milestone-Fund-Management/

> เว็บเริ่มต้นในโหมดสาธิตเพื่อให้ทดลองได้โดยไม่ใช้ Wallet กด **เชื่อมต่อ Wallet** และเลือก Sepolia เพื่ออ่านข้อมูลและทำธุรกรรมกับ Contract ที่ตั้งค่าไว้ด้านล่าง โหมดสาธิตเก็บข้อมูลเฉพาะใน Local Storage และไม่ส่งขึ้น Blockchain

**Sepolia Contract:** [`0x4301EFeAe56d4c04305c0b566Ca471Ff904cabC6`](https://sepolia.etherscan.io/address/0x4301EFeAe56d4c04305c0b566Ca471Ff904cabC6)  
**Deployment Block:** `12133890` · **Chain ID:** `11155111`

หากเคยบันทึก Address อื่นในหน้าการเชื่อมต่อระบบ ให้เปลี่ยนเป็น Address นี้ เพราะการตั้งค่าในเบราว์เซอร์มีลำดับความสำคัญเหนือไฟล์ config ส่วนกลาง

## ฟังก์ชันตามโจทย์

| ข้อ | ฟังก์ชัน                                                     | หน้าจอ / Smart Contract                             |
| --- | ------------------------------------------------------------ | --------------------------------------------------- |
| 1   | สร้างโครงการ ชื่อ รายละเอียด เป้าหมาย ระยะเวลา และ Milestone | สร้างโครงการ / `createCampaign`                     |
| 2   | เชื่อม Wallet และโอน ETH สนับสนุน                            | รายละเอียดโครงการ / `contribute`                    |
| 3   | แสดงยอดระดมทุน เป้าหมาย และเวลาที่เหลือ                      | ภาพรวม สำรวจ รายละเอียด                             |
| 4   | เจ้าของส่งหลักฐานความสำเร็จเพื่อขอเบิก                       | โครงการของฉัน → รายละเอียด / `requestMilestone`     |
| 5   | ผู้สนับสนุนอนุมัติและจ่ายอัตโนมัติเมื่อผ่านเงื่อนไข          | การสนับสนุนของฉัน → รายละเอียด / `approveMilestone` |
| 6   | ขอเงินคืนเมื่อครบกำหนดและไม่ถึงเป้า                          | รายละเอียดโครงการ / `refund`                        |
| 7   | ประวัติเงินเข้า–ออกและสถานะ Milestone                        | ความโปร่งใส, CSV, Etherscan                         |

หน้าจัดการหลังบ้านใช้สิทธิ์จาก Wallet ไม่ใช้ชื่อผู้ใช้/รหัสผ่าน และไม่มีแอดมินที่ถอนเงินได้โดยข้ามการอนุมัติ GitHub Pages ให้บริการไฟล์หน้าเว็บเท่านั้น ส่วนข้อมูล เงิน และกฎสิทธิ์จริงทำงานใน Smart Contract

## เริ่มใช้งานบนเครื่อง

ใช้ Node.js 22 LTS และ npm

```bash
npm ci
npm run compile
npm test
npm run dev
```

```bash
npm run build
npm run preview
```

ไฟล์ที่ได้จาก build อยู่ใน `dist/` ใช้ `base: './'` และ hash routing (`#/dashboard`) จึงเปิดจาก repository subpath ของ GitHub Pages และ reload หน้าย่อยได้

## Deploy Smart Contract ด้วย Remix IDE บน Sepolia

1. ติดตั้ง MetaMask และเปิด Sepolia Testnet รับ Sepolia ETH ทดสอบสำหรับค่า Gas จาก faucet ที่รองรับ
2. เปิด https://remix.ethereum.org แล้วสร้างไฟล์ `InnovateFund.sol` นำเนื้อหาจาก `contracts/InnovateFund.sol` ไปวาง หรือดาวน์โหลดจากหน้าการเชื่อมต่อระบบ
3. ใน Solidity Compiler เลือก **0.8.30**, เปิด **Optimization: 200 runs**, ตั้ง **EVM Version: paris** แล้วกด Compile
4. ใน Deploy & Run Transactions เลือก **Injected Provider – MetaMask** (ชื่ออาจเป็น Browser Extension ตามเวอร์ชัน Remix) ตรวจสอบว่า Wallet และ Remix แสดงเครือข่าย **Sepolia, Chain ID 11155111**
5. เลือกสัญญา `InnovateFund` แล้วกด Deploy สัญญานี้ไม่มี constructor arguments ยืนยันธุรกรรมด้วย Wallet ของคุณ
6. รอธุรกรรมสำเร็จ คัดลอก Contract Address จาก Deployed Contracts และเลข Block จากหน้า deployment transaction บน https://sepolia.etherscan.io
7. เปิดเว็บ InnovateFund → **การเชื่อมต่อระบบ** ใส่ Contract Address และ Deployment Block → บันทึก → เชื่อมต่อ Wallet
8. สำหรับให้ทุกคนใช้ Contract เดียวกันโดยไม่ต้องตั้งค่าเอง แก้ไฟล์ `public/config.json` ใน GitHub แล้ว deploy หน้าเว็บอีกครั้ง

ตัวอย่างไฟล์ config (แทน Address และเลข Block ด้วยค่าจริง):

```json
{
  "chainId": 11155111,
  "contractAddress": "0xYOUR_DEPLOYED_CONTRACT_ADDRESS",
  "deploymentBlock": 12345678,
  "explorerUrl": "https://sepolia.etherscan.io"
}
```

Address ในตัวอย่างเป็น placeholder ไม่ใช่ Contract ที่ deploy แล้ว ห้ามนำ private key หรือ seed phrase ใส่ใน source code, config หรือ GitHub เว็บใช้ Wallet ลงนามและไม่รับ private key

## Deploy GitHub Pages

Repository: https://github.com/srwjd/Blockchain-Crowdfunding-Milestone-Fund-Management

### วิธี GitHub Actions

1. ไปที่ **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push โค้ดไป `main` หรือเปิด **Actions → Deploy to GitHub Pages → Run workflow**
3. Workflow จะ `npm ci` → compile Solidity → ทดสอบ Contract → build หน้าเว็บ → deploy Pages
4. เมื่อสำเร็จเปิด https://srwjd.github.io/Blockchain-Crowdfunding-Milestone-Fund-Management/

### วิธีเผยแพร่จาก branch (กรณีสิทธิ์ GitHub Actions ไม่พร้อม)

มีหน้าเว็บที่ build แล้วใน `docs/` เลือก **Settings → Pages → Source: Deploy from a branch → Branch: main → Folder: /docs → Save**

เมื่อแก้โค้ดและใช้วิธี branch ต้อง build และอัปเดต `docs/` อีกครั้ง:

```bash
npm run compile
npm run build
node scripts/prepare-pages.mjs
```

เลือกใช้วิธีใดวิธีหนึ่งตาม Source ของ Pages ไฟล์ `.nojekyll` ปิด Jekyll เพื่อให้โหลดไฟล์ static ตามปกติ การ deploy ผ่าน Actions จะสร้างจาก source ล่าสุดโดยตรงและไม่ต้องอัปเดต `docs/`

## ทดลองระบบโดยไม่ใช้ Wallet

แถบด้านบนบอก **โหมดสาธิต** ชัดเจน และเลือกทดลองเป็น **ผู้สนับสนุน** หรือ **เจ้าของโครงการ** ได้

1. **สนับสนุน:** เปิด Smart Farm → สนับสนุนโครงการ → ใส่จำนวน ETH → ยืนยัน
2. **ลงคะแนนและจ่ายเงิน:** เปิด AI Care ในบทบาทผู้สนับสนุน → อ่านหลักฐาน Milestone แรก → ยืนยันว่าอ่านแล้ว → อนุมัติ บัญชีสาธิตมีน้ำหนัก 56% จึงปล่อยงบ 2 ETH โดยทันที
3. **ขอเบิกระยะต่อไป:** เปลี่ยนเป็นเจ้าของโครงการ → โครงการของฉัน → AI Care → ส่งหลักฐาน Milestone ที่ 2 → เปลี่ยนเป็นผู้สนับสนุนเพื่อลงคะแนน
4. **คืนเงิน:** ในบทบาทผู้สนับสนุน เปิด Green Loop → ขอคืนเงิน 0.4 ETH → ยืนยัน
5. **สร้าง:** กรอกข้อมูลโครงการ เช่นเป้าหมาย 1 ETH ระยะ 30 วัน และ 2 Milestones งบ 0.4 + 0.6 ETH
6. เปิด **ความโปร่งใส** เพื่อตรวจยอดเงิน สถานะ และส่งออก CSV
7. เริ่มใหม่ได้ที่ **การเชื่อมต่อระบบ → รีเซ็ตโหมดสาธิต**

ข้อมูลสาธิตไม่ส่งขึ้น Blockchain และแยกจากข้อมูล Sepolia ยอดและจำนวนผู้สนับสนุนตัวอย่างใช้เพื่อแสดงหน้าจอ บัญชีจำลองอื่นเป็นกลุ่มยอดตัวอย่าง ไม่ใช่ Wallet จริง

## ทดสอบกับ Sepolia ผ่านเว็บ

- Wallet A สร้างโครงการ เช่น เป้าหมาย `0.003` ETH, Milestones `0.001` + `0.002` ETH
- Wallet B สนับสนุน `0.002` ETH และ Wallet C สนับสนุน `0.001` ETH
- Wallet A ส่งหลักฐาน Milestone 1
- Wallet B มีน้ำหนัก 66.67% ลงคะแนนแล้วระบบโอน `0.001` ETH ให้ A อัตโนมัติในธุรกรรมเดียว
- A ส่งหลักฐานระยะ 2 แล้ว B อนุมัติ ระบบจ่ายส่วนที่เหลือและโครงการเสร็จสมบูรณ์
- ทดสอบคืนเงินโดยสร้างอีกโครงการและสนับสนุนไม่ถึงเป้า รอให้ครบกำหนด (ขั้นต่ำ 1 วัน) แล้วใช้ Wallet ผู้สนับสนุนขอคืนเงิน การทดสอบอัตโนมัติใช้ EVM time travel จึงทดสอบเงื่อนไขนี้ได้ทันที

Wallet เจ้าของไม่สามารถสนับสนุนโครงการตัวเองได้ ต้องใช้คนละบัญชี เฉพาะ Sepolia ETH ทดสอบ ค่า Gas ผู้ส่งธุรกรรมเป็นผู้จ่าย

## กฎที่กำหนดในการออกแบบ

- งบ Milestone ทุกระยะรวมกันต้อง **เท่ากับ** เป้าหมาย รับเงินไม่เกินเป้าหมาย เพื่อให้ยอดจัดสรรและสิทธิ์ลงคะแนนคงที่เมื่อเริ่มเบิก
- ระดมทุน 1–365 วัน, 1–12 Milestones, แต่ละระยะงบมากกว่า 0
- เมื่อครบเป้าเริ่มขอเบิกได้ทันที แม้ยังไม่ถึง deadline
- ขอเบิกตามลำดับ ผ่านทีละระยะ เจ้าของเท่านั้นที่ส่งหลักฐานได้ และหลักฐานเปลี่ยนไม่ได้หลังเริ่มลงคะแนน
- น้ำหนักเสียง = ยอด ETH ที่ผู้สนับสนุนลงไว้ในโครงการนั้นทั้งหมด
- ต้องอนุมัติ **มากกว่า 50%** ของยอดระดมทุน ไม่ใช่ 50% พอดี บัญชีหนึ่งลงคะแนนแต่ละระยะได้ครั้งเดียว
- เสียงที่ทำให้ผ่านเกณฑ์จะโอนงบ Milestone อัตโนมัติ ไม่มีปุ่มถอนเงินตามอำเภอใจ
- คืนเงินได้เฉพาะหลังครบกำหนดและ **ยอดไม่ถึงเป้า** คืนเต็มยอดที่สนับสนุน หักค่า Gas แยกโดย Wallet และคืนซ้ำไม่ได้
- บัญชีเงิน: `raised = escrow + released + refunded` ตรวจสอบแยกรายโครงการ
- Contract ใช้ Checks–Effects–Interactions และ reentrancy guard กับธุรกรรมที่จ่าย ETH
- หน่วยใน Contract คือ wei (1 ETH = 10^18 wei) หน้าบ้านใช้ BigInt/ethers สำหรับการคำนวณและธุรกรรม ไม่คำนวณยอดเงินจริงด้วย floating point

## ขอบเขตและข้อจำกัดที่สำคัญ

- เป็นโครงงานสำหรับ Sepolia ยังไม่ได้ผ่าน external audit สำหรับ Mainnet
- โจทย์ไม่ได้กำหนดการลงคะแนนปฏิเสธ การยกเลิกโครงการที่ครบเป้า หรือเส้นตาย Milestone จึงไม่มีทางลัดคืนเงินหลังครบเป้า หากเจ้าของหยุดทำงานหรือเสียงอนุมัติไม่เกิน 50% เงินที่เหลือจะอยู่ในสัญญา ควรกำหนดนโยบายกรณีนี้ก่อนใช้ระบบเงินจริง
- เมื่อผู้รับเงินเป็น Smart Contract ที่ปฏิเสธ ETH รายการอนุมัติที่ทำให้ผ่านเกณฑ์จะ revert ทั้งธุรกรรม ต้องใช้ Wallet เจ้าของที่รับ ETH ได้
- หลักฐานเก็บเป็นข้อความหรือ URL บน-chain ไม่อัปโหลดเอกสารเข้า server ต้องจัดเก็บเอกสารไว้ในบริการที่เข้าถึงได้ก่อน
- หน้าเว็บอ่านสถานะจาก Contract เมื่อเชื่อมต่อ หลังธุรกรรมที่ตัวเองทำ หรือกดรีเฟรช การทำรายการจาก Wallet อื่นควรรีเฟรชหน้าเว็บ/ข้อมูล
- ประวัติบนเว็บโหลดสูงสุด 50,000 บล็อกล่าสุดจาก deploymentBlock โดยแบ่งคำขอช่วงละ 2,000 บล็อก หาก RPC จำกัดการอ่าน logs จะแสดงข้อความพร้อม Etherscan ยอดสะสมและสถานะอ่านตรงจาก Contract ไม่ได้คำนวณจาก logs ที่โหลดมาบางส่วน
- CSV ส่งออกเฉพาะประวัติที่หน้าเว็บโหลดสำเร็จ ไม่อ้างว่าเป็นประวัติบน-chain ทั้งหมด
- ยอด escrow บน Dashboard คือยอดจัดสรรภายในสัญญา ไม่รวม ETH ที่ถูกบังคับส่งเข้ามาโดยกลไก EVM อื่น เช่น selfdestruct

## โครงสร้าง

```text
contracts/InnovateFund.sol       หลังบ้าน Smart Contract เปิดใน Remix ได้โดยตรง
src/App.jsx                     หน้าบ้าน + หน้าจัดการ + Dialog ธุรกรรม
src/chain.js                    เชื่อม Wallet, อ่านข้อมูลและส่งธุรกรรม
src/data.js                     ข้อมูลและกฎของโหมดสาธิต
src/abi.json                    ABI ที่ compile จาก Contract
src/styles.css                 Responsive UI
public/config.json             ตั้งค่า Sepolia Contract ส่วนกลาง
public/InnovateFund.sol          สำเนา Contract สำหรับดาวน์โหลดจากเว็บ
artifacts/InnovateFund.json      ABI + bytecode + compiler version
scripts/compile.mjs              Compile และสร้าง artifact/ABI
scripts/prepare-pages.mjs        เตรียม docs/ สำหรับ Pages แบบ branch
scripts/publish-config.mjs       อัปเดต config จาก Address และเลขบล็อก
test/contract.test.mjs          ทดสอบธุรกรรมบน EVM จริงใน Ganache
.github/workflows/deploy.yml     CI และ deploy GitHub Pages
```

## ตรวจสอบคุณภาพ

`npm test` ทดสอบ Contract บน Ganache EVM: การตรวจงบและระยะเวลา, จำกัดยอดเงินและสิทธิ์เจ้าของ, ลำดับการขอเบิก, เสียง 50% ไม่ผ่าน, เสียงเกิน 50% จ่ายตรงงบและจ่ายครั้งเดียว, น้ำหนักยอดสะสม, คืนเงินตามเงื่อนไขและป้องกันคืนซ้ำ, ไม่คืนเมื่อครบเป้า, แยก escrow แต่ละโครงการ และป้องกัน reentrancy ตอนคืนเงิน

หากแก้ Contract ให้รัน `npm run compile` แล้ว `npm test` และ deploy Contract ใหม่ สัญญาเดิมไม่สามารถ upgrade ได้
