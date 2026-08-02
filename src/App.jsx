import React, { useState, useEffect, useMemo, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, writeBatch, runTransaction
} from "firebase/firestore";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "firebase/auth";
import {
  ChefHat, Users, CheckCircle, Coffee, ClipboardList, Trash2, Store, Lock, X, AlertTriangle, Link as LinkIcon, Copy, Globe, Clock, ChevronDown, Camera, Smartphone
} from "lucide-react";
import html2canvas from "html2canvas";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyB01OrPIxWYVWrjZVXM_bW6BHYWhc-77Fs",
  authDomain: "teacloud-breakfast.firebaseapp.com",
  projectId: "teacloud-breakfast",
  storageBucket: "teacloud-breakfast.firebasestorage.app",
  messagingSenderId: "784370381872",
  appId: "1:784370381872:web:a39a1a5d91742a311e29f5",
  measurementId: "G-3DJVL3VB0S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "teacloud-breakfast";

// --- Translations ---
const UI_TEXT = {
  zh: {
    title: "茶雲居", subtitle: "訂", selectRoom: "請選擇房號", roomSuffix: "房",
    total: "總計", submit: "確認送出", submitting: "傳送中...",
    successTitle: "預約成功", successMsg: "已完成早餐登記", backHome: "返回首頁",
    alertSelectRoom: "請先選擇房號！", alertNetwork: "傳送失敗，請檢查網路連線",
    selectTemp: "選擇冰/溫", selected: "已選", done: "完成",
    iceLabel: "🧊 冰 (Ice)", warmLabel: "♨️ 溫 (Warm)",
    cancelOrder: "取消訂單", alertCancelConfirm: "確定要取消您個人的餐點嗎？（不影響同房其他人的訂單）",
    modalCancelTitle: "取消訂單", modalBtnNo: "保留餐點", modalBtnYes: "確定取消",
    receiptTitle: "訂單明細", receiptTotal: "本次金額", receiptReminder: "📌 建議截圖保存此明細，以便與店家核對",
    nicknamePlaceholder: "輸入暱稱 (選填)", alertTitle: "系統提示", alertConfirm: "確定",
    personalReceiptTitle: "個人訂單明細", nicknameReceiptSuffix: " 的訂單明細",
    personalSubtotal: "個人小計", roomSharedDisclaimer: "💡 此僅為您個人的點餐明細，不包含同房其他人之餐點。",
    roomTotalBtn: "查看同房總明細", roomTotalTitle: "同房總訂單", emptyRoomOrder: "目前無人點餐", modifyHint: "💡 如需修改，請直接於主畫面調整數量後再次送出"
  },
  en: {
    title: "Tea Cloud", subtitle: "Order", selectRoom: "Select Room", roomSuffix: "",
    total: "Total", submit: "Submit", submitting: "Sending...",
    successTitle: "Success!", successMsg: "Order Completed", backHome: "Home",
    alertSelectRoom: "Please select a room first!", alertNetwork: "Connection error",
    selectTemp: "Ice/Warm", selected: "Selected", done: "Done",
    iceLabel: "🧊 Ice", warmLabel: "♨️ Warm",
    cancelOrder: "Cancel Order", alertCancelConfirm: "Are you sure you want to cancel your personal order? (Other orders in this room won't be affected)",
    modalCancelTitle: "Cancel Order", modalBtnNo: "Keep Order", modalBtnYes: "Yes, Cancel",
    receiptTitle: "Order Details", receiptTotal: "Total Amount", receiptReminder: "📌 Please save a screenshot of this receipt for your records.",
    nicknamePlaceholder: "Nickname (Optional)", alertTitle: "System Alert", alertConfirm: "OK",
    personalReceiptTitle: "Personal Order Details", nicknameReceiptSuffix: "'s Order Details",
    personalSubtotal: "Personal Subtotal", roomSharedDisclaimer: "💡 This is your personal order only. It excludes other orders from the same room.",
    roomTotalBtn: "View Room Total", roomTotalTitle: "Room Total Orders", emptyRoomOrder: "No orders yet", modifyHint: "💡 To modify, please adjust the quantity on the main screen and submit again."
  },
  ko: {
    title: "차윈주", subtitle: "주문", selectRoom: "객실 선택", roomSuffix: "호",
    total: "합계", submit: "제출 확인", submitting: "전송 中...",
    successTitle: "예약 성공", successMsg: "조식 등록이 완료되었습니다", backHome: "홈으로",
    alertSelectRoom: "먼저 객실 번호를 선택해주세요!", alertNetwork: "네트워크 연결 오류",
    selectTemp: "아이스/핫 선택", selected: "선택됨", done: "완료",
    iceLabel: "🧊 아이스 (Ice)", warmLabel: "♨️ 따뜻한 (Warm)",
    cancelOrder: "주문 취소", alertCancelConfirm: "본인의 개인 주문을 취소하시겠습니까? (같은 방 일행의 주문에는 영향을 주지 않습니다)",
    modalCancelTitle: "주문 취소", modalBtnNo: "유지하기", modalBtnYes: "취소하기",
    receiptTitle: "주문 내역", receiptTotal: "결제 금액", receiptReminder: "📌 확인을 위해 이 영수증을 캡처해 두시길 권장합니다.",
    nicknamePlaceholder: "닉네임 (선택)", alertTitle: "시스템 알림", alertConfirm: "확인",
    personalReceiptTitle: "개인 주문 내역", nicknameReceiptSuffix: "님의 주문 내역",
    personalSubtotal: "개인 소계", roomSharedDisclaimer: "💡 본인의 개인 주문 내역입니다. 같은 방 일행의 주문은 포함되지 않습니다.",
    roomTotalBtn: "일행 주문 합계", roomTotalTitle: "일행 주문 합계", emptyRoomOrder: "아직 주문이 없습니다", modifyHint: "💡 수정을 원하시면 메인 화면에서 수량을 조정한 후 다시 제출해 주세요."
  },
  ja: {
    title: "茶雲居", subtitle: "注文", selectRoom: "お部屋を選択", roomSuffix: "号室",
    total: "合計", submit: "送信する", submitting: "送信中...",
    successTitle: "予約完了", successMsg: "朝食の予約が完了しました", backHome: "ホームへ戻る",
    alertSelectRoom: "先にお部屋番号を選択してください！", alertNetwork: "ネットワーク接続を確認してください",
    selectTemp: "アイス/ホット", selected: "選択済", done: "完了",
    iceLabel: "🧊 アイス (Ice)", warmLabel: "♨️ ホット (Warm)",
    cancelOrder: "注文キャンセル", alertCancelConfirm: "あなた個人の注文をキャンセルしてもよろしいですか？（同室の他の方の注文には影響しません）",
    modalCancelTitle: "注文キャンセル", modalBtnNo: "そのままにする", modalBtnYes: "キャンセルする",
    receiptTitle: "注文詳細", receiptTotal: "合計金額", receiptReminder: "📌 確認のため、この明細のスクリーンショットを保存してください。",
    nicknamePlaceholder: "ニックネーム (任意)", alertTitle: "システム通知", alertConfirm: "確認",
    personalReceiptTitle: "個人注文詳細", nicknameReceiptSuffix: " の注文詳細",
    personalSubtotal: "個人小計", roomSharedDisclaimer: "💡 これはあなた個人の注文です。同室の他の方の注文は含まれていません。",
    roomTotalBtn: "同室の注文合計", roomTotalTitle: "同室の注文合計", emptyRoomOrder: "まだ注文がありません", modifyHint: "💡 変更する場合は、メイン画面で数量を調整して再度送信してください。"
  }
};

const CATEGORY_TEXT = {
  '雙人套餐': { zh: '雙人套餐', en: 'Combo for Two', ko: '2인 세트', ja: 'ペアセット' },
  '漢堡類': { zh: '漢堡類', en: 'Burgers', ko: '버거류', ja: 'バーガー類' },
  '吐司類': { zh: '吐司類', en: 'Toasts & Sandwiches', ko: '토스트/샌드위치', ja: 'トースト・サンドイッチ' },
  '蛋餅類': { zh: '蛋餅類', en: 'Omelets', ko: '딴빙', ja: 'ダンビン' },
  '麵類': { zh: '麵類', en: 'Noodles', ko: '면류', ja: '麺類' },
  '單點小食': { zh: '單點小食', en: 'Snacks & Sides', ko: '스낵/사이드', ja: 'スナック・サイド' },
  '飲料類': { zh: '飲料類', en: 'Drinks', ko: '음료류', ja: 'ドリンク類' },
  '其他': { zh: '其他', en: 'Others', ko: '기타', ja: 'その他' }
};

// --- Data ---
const ROOMS = [
  "201", "202", "203", "205", "206", "207", "208", "209",
  "301", "302",
  "601", "602", "603", "605", "606", "607", "608"
];

const SHOPS = [
  { id: 'shopA', name: '盈螢早點', name_en: 'Ying Ying', name_ko: '잉잉', name_ja: 'インイン', icon: Store },
  { id: 'shopB', name: '新協隆早餐', name_en: 'Xin Xie Long', name_ko: '신시에롱', name_ja: 'シンシエロン', icon: ChefHat },
  { id: 'shopC', name: '東方美', name_en: 'Dong Fang Mei', name_ko: '동팡메이', name_ja: '東方美', icon: Coffee },
  { id: 'shopD', name: '三隻小兔', name_en: 'Three Little Rabbits', name_ko: '세 마리 토끼', name_ja: '三匹の子うさぎ', icon: Coffee }
];

const MENU_ITEMS = [
  // Shop A: 盈螢早點 - 雙人套餐區
  { id: 'a201', shopId: 'shopA', name: '雙人套餐A(飯糰,肉粽,蛋餅)*飲料另點', name_en: 'Duo Combo A(Rice Ball,Zongzi,Omelet)*No drink', name_ko: '2인 세트 A(주먹밥,쫑즈,딴빙)*음료 별도', name_ja: 'ペアセットA(おにぎり,ちまき,ダンビン)*飲物別売', price: 130 },
  { id: 'a202', shopId: 'shopA', name: '雙人套餐B(鍋貼+蛋,蘿蔔糕+蛋)*飲料另點', name_en: 'Duo Combo B(Pot Stickers+Egg,Radish Cake+Egg)*No drink', name_ko: '2인 세트 B(군만두+계란,무떡+계란)*음료 별도', name_ja: 'ペアセットB(焼き餃子+卵,大根餅+卵)*飲物別売', price: 110 },
  { id: 'a203', shopId: 'shopA', name: '雙人套餐C(蔥抓餅+蛋,肉鬆蛋餅,饅頭)*飲料另點', name_en: 'Duo Combo C(Scallion Pancake+Egg,Floss Omelet,Bun)*No drink', name_ko: '2인 세트 C(총좌빙+계란,로우쏭딴빙,만터우)*음료 별도', name_ja: 'ペアセットC(ネギパイ+卵,肉でんぶダンビン,マントウ)*飲物別売', price: 110 },
  { id: 'a204', shopId: 'shopA', name: '雙人套餐D(煎餃+蛋,玉米蛋餅,筍包)*飲料另點', name_en: 'Duo Combo D(Fried Dumpling+Egg,Corn Omelet,Bamboo Bun)*No drink', name_ko: '2인 세트 D(튀김만두+계란,옥수수딴빙,죽순찐빵)*음료 별度', name_ja: 'ペアセットD(揚げ餃子+卵,コーンダンビン,タケノコまん)*飲物別売', price: 120 },
  { id: 'a205', shopId: 'shopA', name: '雙人套餐E(飯糰x2,荷包蛋x2)*飲料另點', name_en: 'Duo Combo E(Rice Ball x2,Fried Egg x2)*No drink', name_ko: '2인 세트 E(주먹밥x2,계란프라이x2)*음료 별度', name_ja: 'ペアセットE(おにぎりx2,目玉焼きx2)*飲物別売', price: 120 },
  // Shop A 單點區
  { id: 'a1', shopId: 'shopA', name: '飯糰', name_en: 'Rice Ball', name_ko: '주먹밥', name_ja: 'おにぎり', price: 45 },
  { id: 'a2', shopId: 'shopA', name: '肉粽', name_en: 'Meat Zongzi', name_ko: '고기 쫑즈', name_ja: '肉ちまき', price: 45 },
  { id: 'a3', shopId: 'shopA', name: '鍋貼', name_en: 'Pot Stickers', name_ko: '군만두', name_ja: '焼き餃子', price: 40 },
  { id: 'a5', shopId: 'shopA', name: '煎餃', name_en: 'Fried Dumplings', name_ko: '튀김만두', name_ja: '揚げ焼き餃子', price: 40 },
  { id: 'a7', shopId: 'shopA', name: '肉鬆蛋餅', name_en: 'Pork Floss Omelet', name_ko: '로우쏭 딴빙', name_ja: '肉でんぶダンビン', price: 45 },
  { id: 'a8', shopId: 'shopA', name: '玉米蛋餅', name_en: 'Corn Omelet', name_ko: '옥수수 딴빙', name_ja: 'コーンダンビン', price: 45 },
  { id: 'a9', shopId: 'shopA', name: '蛋餅', name_en: 'Egg Omelet', name_ko: '딴빙 (계란 전병)', name_ja: 'ダンビン', price: 40 },
  { id: 'a10', shopId: 'shopA', name: '蘿蔔糕', name_en: 'Radish Cake', name_ko: '무떡', name_ja: '大根餅', price: 40 },
  { id: 'a12', shopId: 'shopA', name: '手工饅頭', name_en: 'Steamed Bun', name_ko: '수제 만터우', name_ja: '手作りマントウ', price: 15 },
  { id: 'a13', shopId: 'shopA', name: '手工筍包', name_en: 'Bamboo Shoot Bun', name_ko: '죽순 찐빵', name_ja: '手作りタケノコまん', price: 20 },
  { id: 'a15', shopId: 'shopA', name: '饅頭+肉鬆', name_en: 'Bun+Pork Floss', name_ko: '만터우+로우쏭', name_ja: 'マントウ+肉でんぶ', price: 20 },
  { id: 'a16', shopId: 'shopA', name: '饅頭+蛋+肉鬆', name_en: 'Bun+Egg+Floss', name_ko: '만터우+계란+로우쏭', name_ja: 'マントウ+卵+肉でんぶ', price: 35 },
  { id: 'a17', shopId: 'shopA', name: '蔥抓餅', name_en: 'Scallion Pancake', name_ko: '총좌빙 (파전병)', name_ja: 'ネギパイ', price: 35 },
  { id: 'a19', shopId: 'shopA', name: '味噌湯', name_en: 'Miso Soup', name_ko: '미소 된장국', name_ja: '味噌汁', price: 15 },
  { id: 'a20', shopId: 'shopA', name: '玉米濃湯', name_en: 'Corn Soup', name_ko: '옥수수 수프', name_ja: 'コーンスープ', price: 15 },
  { id: 'a21', shopId: 'shopA', name: '牛奶', name_en: 'Milk', name_ko: '우유', name_ja: '牛乳', price: 25 },
  { id: 'a22', shopId: 'shopA', name: '豆漿', name_en: 'Soy Milk', name_ko: '두유', name_ja: '豆乳', price: 15 },
  { id: 'a23', shopId: 'shopA', name: '米漿', name_en: 'Rice-Peanut Milk', name_ko: '쌀 두유 (미장)', name_ja: '米漿(ライスミルク)', price: 15 },
  { id: 'a24', shopId: 'shopA', name: '奶茶', name_en: 'Milk Tea', name_ko: '밀크티', name_ja: 'ミルクティー', price: 15 },
  { id: 'a25', shopId: 'shopA', name: '伯朗咖啡', name_en: 'Mr. Brown Coffee', name_ko: '브라운 커피', name_ja: 'ミスターブラウンコーヒー', price: 25 },
  { id: 'a26', shopId: 'shopA', name: '荷包蛋', name_en: 'Fried Egg', name_ko: '계란 프라이', name_ja: '目玉焼き', price: 15 },

  // Shop B: 新協隆早餐 - 雙人套餐區
  { id: 'b201', shopId: 'shopB', name: '雙人套餐A(粽子x2,煎餃)*飲料另點', name_en: 'Duo Combo A(Zongzi x2,Fried Dumplings)*No drink', name_ko: '2인 세트 A(쫑즈x2,튀김만두)*음료 별도', name_ja: 'ペアセットA(ちまきx2,焼き餃子)*飲物別売', price: 130 },
  { id: 'b202', shopId: 'shopB', name: '雙人套餐B(蔥抓餅加蛋,蘿蔔糕,奶酥厚片)*飲料另點', name_en: 'Duo Combo B(Scallion Pancake+Egg,Radish Cake,Butter Toast)*No drink', name_ko: '2인 세트 B(총좌빙+계란,무떡,버터토스트)*음료 別度', name_ja: 'ペアセットB(ネギパイ+卵,大根餅,バタートースト)*飲物別売', price: 100 },
  { id: 'b203', shopId: 'shopB', name: '雙人套餐C(碗粿x2,脆筍肉包)*飲料另點', name_en: 'Duo Combo C(Rice Pudding x2,Bamboo Meat Bun)*No drink', name_ko: '2인 세트 C(완궈x2,죽순고기찐빵)*음료 별도', name_ja: 'ペアセットC(ワーグイx2,タケノコ肉まん)*飲物別売', price: 85 },
  { id: 'b204', shopId: 'shopB', name: '雙人套餐D(玉米蔬菜蛋餅,起司蛋餅,巧克力厚片)*飲料另點', name_en: 'Duo Combo D(Corn Veggie Omelet,Cheese Omelet,Choco Toast)*No drink', name_ko: '2인 세트 D(채소딴빙,치즈딴빙,초코토스트)*음료 별度', name_ja: 'ペアセットD(野菜ダンビン,チーズダンビン,チョコ厚切り)*飲物別売', price: 110 },
  { id: 'b205', shopId: 'shopB', name: '雙人套餐E(饅頭加蛋x2,蘿蔔糕)*飲料另點', name_en: 'Duo Combo E(Bun with Egg x2,Radish Cake)*No drink', name_ko: '2인 세트 E(만터우+계란x2,무떡)*음료 별도', name_ja: 'ペアセットE(マントウ+卵x2,大根餅)*飲物別売', price: 100 },
  // Shop B 單點區
  { id: 'b1', shopId: 'shopB', name: '粽子', name_en: 'Zongzi', name_ko: '쫑즈', name_ja: 'ちまき', price: 45 },
  { id: 'b2', shopId: 'shopB', name: '饅頭加蛋', name_en: 'Bun with Egg', name_ko: '만터우+계란', name_ja: 'マントウ+卵', price: 35 },
  { id: 'b3', shopId: 'shopB', name: '脆筍肉包', name_en: 'Bamboo Meat Bun', name_ko: '죽순 고기 찐빵', name_ja: 'タケノコ肉まん', price: 25 },
  { id: 'b4', shopId: 'shopB', name: '玉米蔬菜蛋餅', name_en: 'Corn Veggie Omelet', name_ko: '옥수수 채소 딴빙', name_ja: 'コーン野菜ダンビン', price: 40 },
  { id: 'b5', shopId: 'shopB', name: '起司蛋餅', name_en: 'Cheese Omelet', name_ko: '치즈 딴빙', name_ja: 'チーズダンビン', price: 40 },
  { id: 'b6', shopId: 'shopB', name: '蔥抓餅加蛋', name_en: 'Scallion Pancake+Egg', name_ko: '총좌빙+계란', name_ja: 'ネギパイ+卵', price: 40 },
  { id: 'b7', shopId: 'shopB', name: '奶酥厚片', name_en: 'Butter Toast', name_ko: '버터 토스트', name_ja: 'ミルクバタートースト', price: 30 },
  { id: 'b8', shopId: 'shopB', name: '巧克力厚片', name_en: 'Chocolate Toast', name_ko: '초콜릿 토스트', name_ja: 'チョコ厚切りトースト', price: 30 },
  { id: 'b9', shopId: 'shopB', name: '碗粿', name_en: 'Salty Rice Pudding', name_ko: '완궈 (쌀푸딩)', name_ja: 'ワーグイ (米プディング)', price: 30 },
  { id: 'b10', shopId: 'shopB', name: '蘿蔔糕', name_en: 'Radish Cake', name_ko: '무떡', name_ja: '大根餅', price: 30 },
  { id: 'b11', shopId: 'shopB', name: '煎餃', name_en: 'Fried Dumplings', name_ko: '튀김만두', name_ja: '焼き餃子', price: 40 },
  { id: 'b12', shopId: 'shopB', name: '玉米濃湯', name_en: 'Corn Soup', name_ko: '옥수수 수프', name_ja: 'コーンスープ', price: 30 },
  { id: 'b13', shopId: 'shopB', name: '紅茶', name_en: 'Black Tea', name_ko: '홍차', name_ja: '紅茶', price: 15 },
  { id: 'b14', shopId: 'shopB', name: '豆漿', name_en: 'Soy Milk', name_ko: '두유', name_ja: '豆乳', price: 15 },
  { id: 'b15', shopId: 'shopB', name: '南瓜豆漿', name_en: 'Pumpkin Soy Milk', name_ko: '호박 두유', name_ja: 'かぼちゃ豆乳', price: 15 },
  { id: 'b16', shopId: 'shopB', name: '薏仁漿', name_en: 'Job\'s Tears Milk', name_ko: '율무차', name_ja: 'ハトムギミルク', price: 15 },

  // Shop C: 東方美 - 雙人套餐區
  { id: 'c201', shopId: 'shopC', name: '雙人套餐A(招牌漢堡+蛋,烤鮪魚三明治+蛋,薯條)*飲料另點', name_en: 'Duo Combo A(Signature Burger+Egg,Tuna Sandwich+Egg,Fries)*No drink', name_ko: '2인 세트 A(시그니처버거+계란,참치샌드위치+계란,감자튀김)*음료 별도', name_ja: 'ペアセットA(看板バーガー+卵,ツナサンド+卵,ポテト)*飲物別売', price: 140 },
  { id: 'c202', shopId: 'shopC', name: '雙人套餐B(卡拉雞腿漢堡+蛋,鐵板麵-黑胡椒)*飲料另點', name_en: 'Duo Combo B(Crispy Chicken Burger+Egg,Hot Plate Noodles)*No drink', name_ko: '2인 세트 B(크리스피버거+계란,철판면)*음료 별도', name_ja: 'ペアセットB(クリスピーバーガー+卵,鉄板麺)*飲物別売', price: 140 },
  { id: 'c203', shopId: 'shopC', name: '雙人套餐C(烤總匯三明治,炸雞塊,薯餅)*飲料另點', name_en: 'Duo Combo C(Club Sandwich,Nuggets,Hash Brown)*No drink', name_ko: '2인 세트 시C(클럽샌드위치,치킨너겟,해시브라운)*음료 별도', name_ja: 'ペアセットC(クラブサンド,ナゲット,ポテト)*飲物別売', price: 160 },
  { id: 'c204', shopId: 'shopC', name: '雙人套餐D(營養早餐(荷包蛋,厚片火腿,熱狗)x2)*飲料另點', name_en: 'Duo Combo D(Nutritious Breakfast(Egg,Ham,Hot Dog)x2)*No drink', name_ko: '2인 세트 D(영양 조식(계란,햄,핫도그)x2)*음료 별도', name_ja: 'ペアセットD(栄養朝食(卵,ハム,ホットドッグ)x2)*飲物別売', price: 100 },
  { id: 'c205', shopId: 'shopC', name: '雙人套餐E(鍋燒意麵,培根蛋餅,熱狗)*飲料另點', name_en: 'Duo Combo E(Pot Noodles,Bacon Omelet,Hot Dog)*No drink', name_ko: '2인 세트 E(냄비우동,베이컨딴빙,핫도그)*음료 별도', name_ja: 'ペアセットE(鍋焼き麺,ベーコンダンビン,ホットドッグ)*飲物別売', price: 140 },
  // Shop C 單點區
  { id: 'c3', shopId: 'shopC', name: '招牌漢堡(+蛋)', name_en: 'Signature Burger(+Egg)', name_ko: '시그니처 버거(+계란)', name_ja: '看板バーガー(+卵)', price: 55 },
  { id: 'c4', shopId: 'shopC', name: '素食漢堡', name_en: 'Veggie Burger', name_ko: '채식 버거', name_ja: 'ベジバーガー', price: 40 },
  { id: 'c5', shopId: 'shopC', name: '培根漢堡(+蛋)', name_en: 'Bacon Burger(+Egg)', name_ko: '베이컨 버거(+계란)', name_ja: 'ベーコンバーガー(+卵)', price: 65 },
  { id: 'c6', shopId: 'shopC', name: '麥香雞漢堡(+蛋)', name_en: 'Chicken Burger(+Egg)', name_ko: '치킨 버거(+계란)', name_ja: '치킨 버거(+계란)', price: 65 },
  { id: 'c7', shopId: 'shopC', name: '燻雞漢堡(+蛋)', name_en: 'Smoked Chicken Burger(+Egg)', name_ko: '훈제 치킨 버거(+계란)', name_ja: 'スモークチケンバーガー(+卵)', price: 65 },
  { id: 'c8', shopId: 'shopC', name: '里肌排漢堡(+蛋)', name_en: 'Pork Tenderloin Burger(+Egg)', name_ko: '돼지 안심 버거(+계란)', name_ja: '豚ヒレ肉バーガー(+卵)', price: 65 },
  { id: 'c9', shopId: 'shopC', name: '牛肉漢堡(+蛋)', name_en: 'Beef Burger(+Egg)', name_ko: '소고기 버거(+계란)', name_ja: 'ビーフバーガー(+卵)', price: 65 },
  { id: 'c10', shopId: 'shopC', name: '鮭魚漢堡(+蛋)', name_en: 'Salmon Burger(+Egg)', name_ko: '연어 버거(+계란)', name_ja: 'サーモンバーガー(+卵)', price: 70 },
  { id: 'c11', shopId: 'shopC', name: '鱈魚漢堡(+蛋)', name_en: 'Cod Burger(+Egg)', name_ko: '대구 버거(+계란)', name_ja: 'タラバーガー(+卵)', price: 70 },
  { id: 'c12', shopId: 'shopC', name: '花枝漢堡(+蛋)', name_en: 'Calamari Burger(+Egg)', name_ko: '오징어 버거(+계란)', name_ja: 'イカバーガー(+卵)', price: 70 },
  { id: 'c13', shopId: 'shopC', name: '鮮蝦漢堡(+蛋)', name_en: 'Shrimp Burger(+Egg)', name_ko: '새우 버거(+계란)', name_ja: 'エビバーガー(+卵)', price: 70 },
  { id: 'c14', shopId: 'shopC', name: '香烤雞腿漢堡(+蛋)', name_en: 'Roasted Chicken Leg Burger(+Egg)', name_ko: '구운 닭다리 버거(+계란)', name_ja: 'ローストチケンバーガー(+卵)', price: 75 },
  { id: 'c15', shopId: 'shopC', name: '卡拉雞腿漢堡(+蛋)', name_en: 'Crispy Chicken Leg Burger(+Egg)', name_ko: '크리스피 닭다리 버거(+계란)', name_ja: 'クリスピーチケンバーガー(+卵)', price: 75 },
  { id: 'c16', shopId: 'shopC', name: '煉乳吐司', name_en: 'Condensed Milk Toast', name_ko: '연유 토스트', name_ja: '練乳トースト', price: 20 },
  { id: 'c18', shopId: 'shopC', name: '奶油吐司', name_en: 'Butter Toast', name_ko: '버터 토스트', name_ja: 'バタートースト', price: 20 },
  { id: 'c20', shopId: 'shopC', name: '草莓吐司', name_en: 'Strawberry Toast', name_ko: '딸기 토스트', name_ja: 'いちごトースト', price: 20 },
  { id: 'c22', shopId: 'shopC', name: '香蒜吐司', name_en: 'Garlic Toast', name_ko: '마늘 토스트', name_ja: 'ガーリックトースト', price: 25 },
  { id: 'c24', shopId: 'shopC', name: '椰香吐司', name_en: 'Coconut Toast', name_ko: '코코넛 토스트', name_ja: 'ココナッツトースト', price: 25 },
  { id: 'c26', shopId: 'shopC', name: '藍莓吐司', name_en: 'Blueberry Toast', name_ko: '블루베리 토스트', name_ja: 'ブルーベリートースト', price: 20 },
  { id: 'c28', shopId: 'shopC', name: '花生吐司', name_en: 'Peanut Toast', name_ko: '땅콩 토스트', name_ja: 'ピーナッツトースト', price: 25 },
  { id: 'c30', shopId: 'shopC', name: '巧克力吐司', name_en: 'Chocolate Toast', name_ko: '초콜릿 토스트', name_ja: 'チョコトースト', price: 20 },
  { id: 'c32', shopId: 'shopC', name: '焗烤鮪魚玉米起司厚片吐司', name_en: 'Tuna & Corn Cheese Toast', name_ko: '참치 콘치즈 두꺼운 토스트', name_ja: 'ツナコーンチーズ厚切り', price: 75 },
  { id: 'c33', shopId: 'shopC', name: '烤煎蛋三明治(+蛋)', name_en: 'Fried Egg Sandwich(+Egg)', name_ko: '계란 프라이 샌드위치(+계란)', name_ja: '目玉焼きサンド(+卵)', price: 35 },
  { id: 'c34', shopId: 'shopC', name: '烤肉鬆三明治(+蛋)', name_en: 'Pork Floss Sandwich(+Egg)', name_ko: '로우쏭 샌드위치(+계란)', name_ja: '肉でんぶサンド(+卵)', price: 50 },
  { id: 'c35', shopId: 'shopC', name: '烤鮪魚三明治(+蛋)', name_en: 'Tuna Sandwich(+Egg)', name_ko: '참치 샌드위치(+계란)', name_ja: 'ツナサンド(+卵)', price: 50 },
  { id: 'c36', shopId: 'shopC', name: '烤起司三明治(+蛋)', name_en: 'Cheese Sandwich(+Egg)', name_ko: '치즈 샌드위치(+계란)', name_ja: 'チーズサンド(+卵)', price: 50 },
  { id: 'c37', shopId: 'shopC', name: '烤肉排三明治(+蛋)', name_en: 'Pork Patty Sandwich(+Egg)', name_ko: '돼지 패티 샌드위치(+계란)', name_ja: '豚肉サンド(+卵)', price: 55 },
  { id: 'c38', shopId: 'shopC', name: '素食三明治', name_en: 'Veggie Sandwich', name_ko: '채식 샌드위치', name_ja: 'ベジサンド', price: 40 },
  { id: 'c39', shopId: 'shopC', name: '烤燻雞三明治(+蛋)', name_en: 'Smoked Chicken Sandwich(+Egg)', name_ko: '훈제 치킨 샌드위치(+계란)', name_ja: 'スモークチケンサンド(+卵)', price: 65 },
  { id: 'c40', shopId: 'shopC', name: '烤麥香雞三明治(+蛋)', name_en: 'Chicken Sandwich(+Egg)', name_ko: '치킨 샌드위치(+계란)', name_ja: 'チケンサンド(+卵)', price: 65 },
  { id: 'c41', shopId: 'shopC', name: '烤里肌三明治(+蛋)', name_en: 'Pork Tenderloin Sandwich(+Egg)', name_ko: '돼지 안심 샌드위치(+계란)', name_ja: '豚ヒレサンド(+卵)', price: 65 },
  { id: 'c42', shopId: 'shopC', name: '烤牛肉三明治(+蛋)', name_en: 'Beef Sandwich(+Egg)', name_ko: '소고기 샌드위치(+계란)', name_ja: 'ビーフサンド(+卵)', price: 65 },
  { id: 'c43', shopId: 'shopC', name: '烤厚片火腿三明治(+蛋)', name_en: 'Thick Ham Sandwich(+Egg)', name_ko: '두꺼운 햄 샌드위치(+계란)', name_ja: '厚切りハムサンド(+卵)', price: 65 },
  { id: 'c44', shopId: 'shopC', name: '烤培根三明治(+蛋)', name_en: 'Bacon Sandwich(+Egg)', name_ko: '베이컨 샌드위치(+계란)', name_ja: 'ベーコンサンド(+卵)', price: 65 },
  { id: 'c45', shopId: 'shopC', name: '水果綜合三明治', name_en: 'Mixed Fruit Sandwich', name_ko: '종합 과일 샌드위치', name_ja: 'フルーツサンド', price: 55 },
  { id: 'c46', shopId: 'shopC', name: '烤花枝三明治(+蛋)', name_en: 'Calamari Sandwich(+Egg)', name_ko: '오징어 샌드위치(+계란)', name_ja: 'イカサンド(+卵)', price: 70 },
  { id: 'c47', shopId: 'shopC', name: '烤鮭魚三明治(+蛋)', name_en: 'Salmon Sandwich(+Egg)', name_ko: '연어 샌드위치(+계란)', name_ja: 'サーモンサンド(+卵)', price: 70 },
  { id: 'c48', shopId: 'shopC', name: '烤鱈魚三明治(+蛋)', name_en: 'Cod Sandwich(+Egg)', name_ko: '대구 샌드위치(+계란)', name_ja: 'タラサンド(+卵)', price: 70 },
  { id: 'c49', shopId: 'shopC', name: '烤鮮蝦三明治(+蛋)', name_en: 'Shrimp Sandwich(+Egg)', name_ko: '새우 샌드위치(+계란)', name_ja: 'エビサンド(+卵)', price: 70 },
  { id: 'c50', shopId: 'shopC', name: '卡拉雞腿三明治(+蛋)', name_en: 'Crispy Chicken Sandwich(+Egg)', name_ko: '크리스피 치킨 샌드위치(+계란)', name_ja: 'クリスピーチケンサンド(+卵)', price: 75 },
  { id: 'c51', shopId: 'shopC', name: '香烤雞腿三明治(+蛋)', name_en: 'Roasted Chicken Sandwich(+Egg)', name_ko: '구운 닭다리 샌드위치(+계란)', name_ja: 'ローストチケンサンド(+卵)', price: 75 },
  { id: 'c52', shopId: 'shopC', name: '烤總匯三明治', name_en: 'Club Sandwich', name_ko: '클럽 샌드위치', name_ja: 'クラブサンド', price: 85 },
  { id: 'c53', shopId: 'shopC', name: '熱狗蛋捲', name_en: 'Hot Dog Egg Roll', name_ko: '핫도그 계란말이', name_ja: 'ホットドッグ卵巻き', price: 45 },
  { id: 'c54', shopId: 'shopC', name: '招牌燒餅', name_en: 'Signature Shaobing', name_ko: '시그니처 샤오빙', name_ja: '看板焼餅', price: 75 },
  { id: 'c55', shopId: 'shopC', name: '蛋餅', name_en: 'Egg Omelet', name_ko: '딴빙', name_ja: 'ダンビン', price: 35 },
  { id: 'c56', shopId: 'shopC', name: '玉米蛋餅', name_en: 'Corn Omelet', name_ko: '옥수수 딴빙', name_ja: 'コーンダンビン', price: 45 },
  { id: 'c57', shopId: 'shopC', name: '鮪魚蛋餅', name_en: 'Tuna Omelet', name_ko: '참치 딴빙', name_ja: 'ツナダンビン', price: 45 },
  { id: 'c58', shopId: 'shopC', name: '起司蛋餅', name_en: 'Cheese Omelet', name_ko: '치즈 딴빙', name_ja: 'チーズダンビン', price: 45 },
  { id: 'c59', shopId: 'shopC', name: '肉鬆蛋餅', name_en: 'Pork Floss Omelet', name_ko: '로우쏭 딴빙', name_ja: '肉でんぶダンビン', price: 45 },
  { id: 'c60', shopId: 'shopC', name: '火腿蛋餅', name_en: 'Ham Omelet', name_ko: '햄 딴빙', name_ja: 'ハムダンビン', price: 45 },
  { id: 'c61', shopId: 'shopC', name: '培根蛋餅', name_en: 'Bacon Omelet', name_ko: '베이컨 딴빙', name_ja: 'ベーコンダンビン', price: 45 },
  { id: 'c62', shopId: 'shopC', name: '熱狗 (2支)', name_en: 'Hot Dog (2 pcs)', name_ko: '핫도그 (2개)', name_ja: 'ホットドッグ(2本)', price: 30 },
  { id: 'c63', shopId: 'shopC', name: '香蔥抓餅', name_en: 'Scallion Pancake', name_ko: '총좌빙', name_ja: 'ネギパイ', price: 40 },
  { id: 'c64', shopId: 'shopC', name: '玉米濃湯', name_en: 'Corn Soup', name_ko: '옥수수 수프', name_ja: 'コーンスープ', price: 35 },
  { id: 'c65', shopId: 'shopC', name: '鍋貼', name_en: 'Pot Stickers', name_ko: '군만두', name_ja: '焼き餃子', price: 50 },
  { id: 'c66', shopId: 'shopC', name: '煎餃', name_en: 'Fried Dumplings', name_ko: '튀김만두', name_ja: '揚げ焼き餃子', price: 50 },
  { id: 'c67', shopId: 'shopC', name: '蘿蔔糕', name_en: 'Radish Cake', name_ko: '무떡', name_ja: '大根餅', price: 50 },
  { id: 'c68', shopId: 'shopC', name: '港式煎包', name_en: 'Pan-fried Bun', name_ko: '홍콩식 찐빵 구이', name_ja: '焼きまんじゅう', price: 50 },
  { id: 'c69', shopId: 'shopC', name: '薯條', name_en: 'French Fries', name_ko: '감자튀김', name_ja: 'フライドポテト', price: 35 },
  { id: 'c70', shopId: 'shopC', name: '薯餅', name_en: 'Hash Brown', name_ko: '해시브라운', name_ja: 'ハッシュドポテト', price: 30 },
  { id: 'c71', shopId: 'shopC', name: '炸雞塊', name_en: 'Chicken Nuggets', name_ko: '치킨 너겟', name_ja: 'チキンナゲット', price: 45 },
  { id: 'c72', shopId: 'shopC', name: '營養早餐(荷包蛋,厚片火腿,熱狗)', name_en: 'Nutritious Breakfast', name_ko: '영양 조식', name_ja: '栄養朝食セット', price: 50 },
  { id: 'c73', shopId: 'shopC', name: '鐵板麵', name_en: 'Hot Plate Noodles', name_ko: '철판면', name_ja: '鉄板麺', price: 65 },
  { id: 'c75', shopId: 'shopC', name: '鍋燒麵', name_en: 'Pot Noodles', name_ko: '냄비 우동', name_ja: '鍋焼き麺', price: 65 },
  { id: 'c78', shopId: 'shopC', name: '紅茶(小)', name_en: 'Black Tea (S)', name_ko: '홍차 (소)', name_ja: '紅茶(小)', price: 20 },
  { id: 'c79', shopId: 'shopC', name: '紅茶(大)', name_en: 'Black Tea (L)', name_ko: '홍차 (대)', name_ja: '紅茶(大)', price: 25 },
  { id: 'c80', shopId: 'shopC', name: '奶茶(小)', name_en: 'Milk Tea (S)', name_ko: '밀크티 (소)', name_ja: 'ミルクティー(小)', price: 20 },
  { id: 'c81', shopId: 'shopC', name: '奶茶(大)', name_en: 'Milk Tea (L)', name_ko: '밀크티 (대)', name_ja: 'ミルクティー(大)', price: 25 },
  { id: 'c82', shopId: 'shopC', name: '可樂(小)', name_en: 'Cola (S)', name_ko: '콜라 (소)', name_ja: 'コーラ(小)', price: 20 },
  { id: 'c83', shopId: 'shopC', name: '可樂(大)', name_en: 'Cola (L)', name_ko: '콜라 (대)', name_ja: 'コーラ(大)', price: 25 },
  { id: 'c84', shopId: 'shopC', name: '研磨豆漿(小)', name_en: 'Soy Milk (S)', name_ko: '두유 (소)', name_ja: '豆乳(小)', price: 20 },
  { id: 'c85', shopId: 'shopC', name: '研磨豆漿(大)', name_en: 'Soy Milk (L)', name_ko: '두유 (대)', name_ja: '豆乳(大)', price: 25 },
  { id: 'c86', shopId: 'shopC', name: '柳橙汁(小)', name_en: 'Orange Juice (S)', name_ko: '오렌지 주스 (소)', name_ja: 'オレンジジュース(小)', price: 35 },
  { id: 'c87', shopId: 'shopC', name: '柳橙汁(大)', name_en: 'Orange Juice (L)', name_ko: '오렌지 주스 (대)', name_ja: 'オレンジジュース(大)', price: 40 },
  { id: 'c88', shopId: 'shopC', name: '檸檬汁(小)', name_en: 'Lemonade (S)', name_ko: '레모네이드 (소)', name_ja: 'レモネード(小)', price: 35 },
  { id: 'c89', shopId: 'shopC', name: '檸檬汁(大)', name_en: 'Lemonade (L)', name_ko: '레모네이드 (대)', name_ja: 'レモネード(大)', price: 40 },
  { id: 'c90', shopId: 'shopC', name: '百香果汁(小)', name_en: 'Passion Fruit Juice (S)', name_ko: '패션후르츠 주스 (소)', name_ja: 'パッションフルーツ(小)', price: 35 },
  { id: 'c91', shopId: 'shopC', name: '百香果汁(大)', name_en: 'Passion Fruit Juice (L)', name_ko: '패션후르츠 주스 (대)', name_ja: 'パッションフルーツ(大)', price: 40 },
  { id: 'c92', shopId: 'shopC', name: '蔓越莓汁(小)', name_en: 'Cranberry Juice (S)', name_ko: '크랜베리 주스 (소)', name_ja: 'クランベリー(小)', price: 35 },
  { id: 'c93', shopId: 'shopC', name: '蔓越莓汁(大)', name_en: 'Cranberry Juice (L)', name_ko: '크랜베리 주스 (대)', name_ja: 'クランベリー(大)', price: 40 },
  { id: 'c94', shopId: 'shopC', name: '咖啡牛奶(小)', name_en: 'Coffee Milk (S)', name_ko: '커피 우유 (소)', name_ja: 'コーヒー牛乳(小)', price: 40 },
  { id: 'c95', shopId: 'shopC', name: '咖啡牛奶(大)', name_en: 'Coffee Milk (L)', name_ko: '커피 우유 (대)', name_ja: 'コーヒー牛乳(大)', price: 45 },
  { id: 'c96', shopId: 'shopC', name: '杏仁奶(小)', name_en: 'Almond Milk (S)', name_ko: '아몬드 우유 (소)', name_ja: 'アーモンドミルク(小)', price: 35 },
  { id: 'c97', shopId: 'shopC', name: '米漿(小)', name_en: 'Rice-Peanut Milk (S)', name_ko: '쌀 두유 (소)', name_ja: '米漿(小)', price: 35 },
  { id: 'c98', shopId: 'shopC', name: '冷泡烏龍茶(小)', name_en: 'Oolong Tea (S)', name_ko: '우롱차 (소)', name_ja: '烏龍茶(小)', price: 40 },
  { id: 'c99', shopId: 'shopC', name: '牛奶(草莓)', name_en: 'Strawberry Milk', name_ko: '딸기 우유', name_ja: 'いちごミルク', price: 35 },
  { id: 'c100', shopId: 'shopC', name: '牛奶(果汁)', name_en: 'Fruit Milk', name_ko: '과일 우유', name_ja: 'フルーツ牛乳', price: 35 },
  { id: 'c101', shopId: 'shopC', name: '牛奶(麥芽)', name_en: 'Malt Milk', name_ko: '맥아 우유', name_ja: '麦芽牛乳', price: 35 },
  { id: 'c102', shopId: 'shopC', name: '牛奶(原味)', name_en: 'Plain Milk', name_ko: '흰 우유', name_ja: '牛乳(プレーン)', price: 35 },
  { id: 'c103', shopId: 'shopC', name: '牛奶(巧克力)', name_en: 'Chocolate Milk', name_ko: '초코 우유', name_ja: 'チョコミルク', price: 35 },

  // Shop D: 三隻小兔
  { id: 'd1', shopId: 'shopD', name: '玉米漢堡', name_en: 'Corn Burger', name_ko: '옥수수 버거', name_ja: 'コーンバーガー', price: 45, isPersonalOnly: true },
  { id: 'd3', shopId: 'shopD', name: '肉鬆漢堡', name_en: 'Pork Floss Burger', name_ko: '로우쏭 버거', name_ja: '肉でんぶバーガー', price: 45, isPersonalOnly: true },
  { id: 'd5', shopId: 'shopD', name: '豬肉漢堡', name_en: 'Pork Burger', name_ko: '돼지고기 버거', name_ja: 'ポークバーガー', price: 50, isPersonalOnly: true },
  { id: 'd7', shopId: 'shopD', name: '香雞漢堡', name_en: 'Chicken Burger', name_ko: '치킨 버거', name_ja: 'チキントバーガー', price: 50, isPersonalOnly: true },
  { id: 'd9', shopId: 'shopD', name: '火腿漢堡', name_en: 'Ham Burger', name_ko: '햄 버거', name_ja: 'ハムバーガー', price: 50, isPersonalOnly: true },
  { id: 'd11', shopId: 'shopD', name: '培根漢堡', name_en: 'Bacon Burger', name_ko: '베이컨 버거', name_ja: 'ベーコンバーガー', price: 50, isPersonalOnly: true },
  { id: 'd13', shopId: 'shopD', name: '鮪魚漢堡', name_en: 'Tuna Burger', name_ko: '참치 버거', name_ja: 'ツナバーガー', price: 50, isPersonalOnly: true },
  { id: 'd15', shopId: 'shopD', name: '燒肉漢堡', name_en: 'Roast Pork Burger', name_ko: '불고기 버거', name_ja: '焼肉バーガー', price: 55, isPersonalOnly: true },
  { id: 'd17', shopId: 'shopD', name: '牛肉漢堡', name_en: 'Beef Burger', name_ko: '소고기 버거', name_ja: 'ビーフバーガー', price: 60, isPersonalOnly: true },
  { id: 'd19', shopId: 'shopD', name: '豬排漢堡', name_en: 'Pork Chop Burger', name_ko: '돼지 갈비 버거', name_ja: 'ポークチョップバーガー', price: 60, isPersonalOnly: true },
  { id: 'd21', shopId: 'shopD', name: '雞排漢堡', name_en: 'Chicken Chop Burger', name_ko: '치킨 스테이크 버거', name_ja: 'チキントカツバーガー', price: 60, isPersonalOnly: true },
  { id: 'd23', shopId: 'shopD', name: '卡拉雞腿漢堡(原味)', name_en: 'Crispy Chicken Burger (Original)', name_ko: '크리스피 치킨 버거 (오리지널)', name_ja: 'クリスピーチケンバーガー(オリジナル)', price: 75, isPersonalOnly: true },
  { id: 'd25', shopId: 'shopD', name: '卡拉雞腿漢堡(辣味)', name_en: 'Crispy Chicken Burger (Spicy)', name_ko: '크리스피 치킨 버거 (스파이시)', name_ja: 'クリスピーチケンバーガー(スパイシー)', price: 75, isPersonalOnly: true },
  { id: 'd27', shopId: 'shopD', name: '土司夾蛋', name_en: 'Toast with Egg', name_ko: '계란 토스트', name_ja: '卵トースト', price: 30 },
  { id: 'd29', shopId: 'shopD', name: '火腿土司', name_en: 'Ham Toast', name_ko: '햄 토스트', name_ja: 'ハムトースト', price: 35 },
  { id: 'd31', shopId: 'shopD', name: '玉米土司', name_en: 'Corn Toast', name_ko: '옥수수 토스트', name_ja: 'コーントースト', price: 40 },
  { id: 'd33', shopId: 'shopD', name: '肉鬆土司', name_en: 'Pork Floss Toast', name_ko: '로우쏭 토스트', name_ja: '肉でんぶトースト', price: 40 },
  { id: 'd35', shopId: 'shopD', name: '豬肉土司', name_en: 'Pork Toast', name_ko: '돼지고기 토스트', name_ja: 'ポークトースト', price: 45 },
  { id: 'd37', shopId: 'shopD', name: '香雞土司', name_en: 'Chicken Toast', name_ko: '치킨 토스트', name_ja: 'チキントースト', price: 45 },
  { id: 'd39', shopId: 'shopD', name: '培根土司', name_en: 'Bacon Toast', name_ko: '베이컨 토스트', name_ja: 'ベーコントースト', price: 45 },
  { id: 'd41', shopId: 'shopD', name: '鮪魚土司', name_en: 'Tuna Toast', name_ko: '참치 토스트', name_ja: 'ツナトースト', price: 45 },
  { id: 'd43', shopId: 'shopD', name: '燒肉土司', name_en: 'Roast Pork Toast', name_ko: '불고기 토스트', name_ja: '焼肉トースト', price: 45 },
  { id: 'd45', shopId: 'shopD', name: '卡拉雞腿土司(原味)', name_en: 'Crispy Chicken Toast (Original)', name_ko: '크리스피 치킨 토스트 (오리지널)', name_ja: 'クリスピーチキントースト(オリジナル)', price: 75 },
  { id: 'd47', shopId: 'shopD', name: '卡拉雞腿土司(辣味)', name_en: 'Crispy Chicken Toast (Spicy)', name_ko: '크리스피 치킨 토스트 (스파이시)', name_ja: 'クリスピーチキントースト(スパイシー)', price: 75 },
  { id: 'd49', shopId: 'shopD', name: '總匯土司', name_en: 'Club Sandwich', name_ko: '클럽 샌드위치', name_ja: 'クラブサンドイッチ', price: 55 },
  { id: 'd51', shopId: 'shopD', name: '草莓吐司', name_en: 'Strawberry Toast', name_ko: '딸기 토스트', name_ja: 'いちごトースト', price: 20 },
  { id: 'd53', shopId: 'shopD', name: '奶油吐司', name_en: 'Butter Toast', name_ko: '버터 토스트', name_ja: 'バタートースト', price: 25 },
  { id: 'd55', shopId: 'shopD', name: '花生吐司', name_en: 'Peanut Toast', name_ko: '땅콩 토스트', name_ja: 'ピーナッツトースト', price: 25 },
  { id: 'd57', shopId: 'shopD', name: '巧克力吐司', name_en: 'Chocolate Toast', name_ko: '초콜릿 토스트', name_ja: 'チョコトースト', price: 25 },
  { id: 'd59', shopId: 'shopD', name: '奶酥吐司', name_en: 'Milk Paste Toast', name_ko: '밀크 페이스트 토스트', name_ja: '밀크 페이스트 토스트', price: 25 },
  { id: 'd61', shopId: 'shopD', name: '原味蛋餅', name_en: 'Original Omelet', name_ko: '오리지널 딴빙', name_ja: 'オリジナルダンビン', price: 25 },
  { id: 'd63', shopId: 'shopD', name: '豬肉蛋餅', name_en: 'Pork Omelet', name_ko: '돼지고기 딴빙', name_ja: 'ポークダンビン', price: 35 },
  { id: 'd65', shopId: 'shopD', name: '火腿蛋餅', name_en: 'Ham Omelet', name_ko: '햄 딴빙', name_ja: 'ハムダンビン', price: 30 },
  { id: 'd67', shopId: 'shopD', name: '肉鬆蛋餅', name_en: 'Pork Floss Omelet', name_ko: '로우쏭 딴빙', name_ja: '肉でんぶダンビン', price: 35 },
  { id: 'd69', shopId: 'shopD', name: '玉米蛋餅', name_en: 'Corn Omelet', name_ko: '옥수수 딴빙', name_ja: 'コーンダンビン', price: 35 },
  { id: 'd71', shopId: 'shopD', name: '培根蛋餅', name_en: 'Bacon Omelet', name_ko: '베이컨 딴빙', name_ja: 'ベーコンダンビン', price: 40 },
  { id: 'd73', shopId: 'shopD', name: '鮪魚蛋餅', name_en: 'Tuna Omelet', name_ko: '참치 딴빙', name_ja: 'ツナダンビン', price: 40 },
  { id: 'd75', shopId: 'shopD', name: '薯餅蛋餅', name_en: 'Hash Brown Omelet', name_ko: '해시브라운 딴빙', name_ja: 'ハッシュドポテトダンビン', price: 40 },
  { id: 'd77', shopId: 'shopD', name: '燒肉蛋餅', name_en: 'Roast Pork Omelet', name_ko: '불고기 딴빙', name_ja: '焼肉ダンビン', price: 45 },
  { id: 'd79', shopId: 'shopD', name: '卡拉雞腿蛋餅原味', name_en: 'Crispy Chicken Omelet Orig', name_ko: '크리스피 치킨 딴빙 오리지널', name_ja: 'クリスピーチキンダンビン オリジナル', price: 65 },
  { id: 'd81', shopId: 'shopD', name: '卡拉雞腿蛋餅辣味', name_en: 'Crispy Chicken Omelet Spicy', name_ko: '크리스피 치킨 딴빙 스파이시', name_ja: 'クリスピーチキンダンビン スパイシー', price: 65 },
  { id: 'd83', shopId: 'shopD', name: '荷包蛋', name_en: 'Fried Egg', name_ko: '계란 프라이', name_ja: '目玉焼き', price: 15 },
  { id: 'd84', shopId: 'shopD', name: '饅頭', name_en: 'Steamed Bun', name_ko: '만터우', name_ja: 'マントウ', price: 20 },
  { id: 'd85', shopId: 'shopD', name: '薯條', name_en: 'French Fries', name_ko: '감자튀김', name_ja: 'フライドポテト', price: 30 },
  { id: 'd86', shopId: 'shopD', name: '蘿蔔糕', name_en: 'Radish Cake', name_ko: '무떡', name_ja: '大根餅', price: 30 },
  { id: 'd87', shopId: 'shopD', name: '饅頭夾蛋', name_en: 'Bun with Egg', name_ko: '만터우 계란 샌드', name_ja: 'マントウの卵サンド', price: 35 },
  { id: 'd88', shopId: 'shopD', name: '玉米濃湯', name_en: 'Corn Soup', name_ko: '옥수수 수프', name_ja: 'コーンスープ', price: 35 },
  { id: 'd89', shopId: 'shopD', name: '薯餅4塊', name_en: 'Hash Brown (4 pcs)', name_ko: '해시브라운 (4개)', name_ja: 'ハッシュドポテト(4個)', price: 40 },
  { id: 'd90', shopId: 'shopD', name: '熱狗3條', name_en: 'Hot Dog (3 pcs)', name_ko: '핫도그 (3개)', name_ja: 'ホットドッグ(3本)', price: 40 },
  { id: 'd91', shopId: 'shopD', name: '熱狗捲', name_en: 'Hot Dog Roll', name_ko: '핫도그 롤', name_ja: 'ホットドッグロール', price: 45 },
  { id: 'd92', shopId: 'shopD', name: '雞球6顆', name_en: 'Chicken Balls (6 pcs)', name_ko: '치킨 볼 (6개)', name_ja: 'チキンボール(6個)', price: 45 },
  { id: 'd93', shopId: 'shopD', name: '雞塊5塊', name_en: 'Chicken Nuggets (5 pcs)', name_ko: '치킨 너겟 (5개)', name_ja: 'チキンナゲット(5個)', price: 50 },
  { id: 'd94', shopId: 'shopD', name: '鍋貼', name_en: 'Pot Stickers', name_ko: '군만두', name_ja: '焼き餃子', price: 50 },
  { id: 'd95', shopId: 'shopD', name: '鐵板麵', name_en: 'Hot Plate Noodles', name_ko: '철판면', name_ja: '鉄板麺', price: 50 },
  { id: 'd109', shopId: 'shopD', name: '鐵板麵(+蛋)', name_en: 'Hot Plate Noodles(+Egg)', name_ko: '철판면(+계란)', name_ja: '鉄板麺(+卵)', price: 65 },
  { id: 'd108', shopId: 'shopD', name: '肉粽', name_en: 'Meat Zongzi', name_ko: '고기 쫑즈', name_ja: '肉ちまき', price: 55 },
  { id: 'd96', shopId: 'shopD', name: '豆漿(小)', name_en: 'Soy Milk (S)', name_ko: '두유 (소)', name_ja: '豆乳(小)', price: 20 },
  { id: 'd97', shopId: 'shopD', name: '豆漿(大)', name_en: 'Soy Milk (L)', name_ko: '두유 (대)', name_ja: '豆乳(大)', price: 30 },
  { id: 'd98', shopId: 'shopD', name: '紅茶(小)', name_en: 'Black Tea (S)', name_ko: '홍차 (소)', name_ja: '紅茶(小)', price: 20 },
  { id: 'd99', shopId: 'shopD', name: '紅茶(大)', name_en: 'Black Tea (L)', name_ko: '홍차 (대)', name_ja: '紅茶(大)', price: 30 },
  { id: 'd100', shopId: 'shopD', name: '奶茶(小)', name_en: 'Milk Tea (S)', name_ko: '밀크티 (소)', name_ja: 'ミルクティー(小)', price: 20 },
  { id: 'd101', shopId: 'shopD', name: '奶茶(大)', name_en: 'Milk Tea (L)', name_ko: '밀크티 (대)', name_ja: 'ミルクティー(大)', price: 30 },
  { id: 'd102', shopId: 'shopD', name: '紅茶豆漿(小)', name_en: 'Black Tea Soy Milk (S)', name_ko: '홍차 두유 (소)', name_ja: '紅茶豆乳(小)', price: 20 },
  { id: 'd103', shopId: 'shopD', name: '紅茶豆漿(大)', name_en: 'Black Tea Soy Milk (L)', name_ko: '홍차 두유 (대)', name_ja: '紅茶豆乳(大)', price: 30 },
  { id: 'd104', shopId: 'shopD', name: '紅茶鮮奶(小)', name_en: 'Black Tea Fresh Milk (S)', name_ko: '홍차 우유 (소)', name_ja: '紅茶ミルク(小)', price: 40 },
  { id: 'd105', shopId: 'shopD', name: '紅茶鮮奶(大)', name_en: 'Black Tea Fresh Milk (L)', name_ko: '홍차 우유 (대)', name_ja: '紅茶ミルク(大)', price: 45 },
  { id: 'd106', shopId: 'shopD', name: '鮮奶豆漿(小)', name_en: 'Fresh Milk Soy Milk (S)', name_ko: '우유 두유 (소)', name_ja: 'ミルク豆乳(小)', price: 40 },
  { id: 'd107', shopId: 'shopD', name: '鮮奶豆漿(大)', name_en: 'Fresh Milk Soy Milk (L)', name_ko: '우유 두유 (대)', name_ja: 'ミルク豆乳(大)', price: 45 },
];

// 自動將東方美與三隻小兔的飲料加上溫度選項，以及依照品名自動分類
MENU_ITEMS.forEach(item => {
  if (item.name.includes('套餐')) {
    item.category = '雙人套餐';
  } else if (item.name.includes('漢堡')) {
    item.category = '漢堡類';
  } else if (item.name.includes('吐司') || item.name.includes('土司') || item.name.includes('厚片') || item.name.includes('三明治')) {
    item.category = '吐司類';
  } else if (item.name.includes('蛋餅')) {
    item.category = '蛋餅類';
  } else if (item.name.match(/紅茶|豆漿|奶茶|可樂|柳橙|檸檬|百香|咖啡|拿鐵|蔓越莓|杏仁奶|烏龍|牛奶|薏仁|米漿|味噌湯|玉米濃湯|果汁|湯/)) {
    item.category = '飲料類';
  } else if (item.name.includes('麵')) {
    item.category = '麵類';
  } else {
    item.category = '單點小食';
  }

  if (item.shopId === 'shopC' && item.id.startsWith('c')) {
    const num = parseInt(item.id.replace('c', ''));
    if (num >= 78 && num <= 103 && num !== 82 && num !== 83) {
      item.hasTemp = true;
    }
  }
  if (item.shopId === 'shopD' && item.id.startsWith('d')) {
    const num = parseInt(item.id.replace('d', ''));
    if (num >= 96 && num <= 107) {
      item.hasTemp = true;
    }
  }
});

const MENU_MAP = Object.fromEntries(MENU_ITEMS.map(i => [i.id, i]));

const CUSTOMIZATION_OPTIONS = {
  // === 既有客製化（口味/種類/醬料）===
  'd95': {
    label: '選擇口味', label_en: 'Select Flavor', label_ko: '맛 선택', label_ja: '味を選択',
    options: [
      { value: '蘑菇', label_en: 'Mushroom', label_ko: '버섯', label_ja: 'マッシュルーム' },
      { value: '黑胡椒', label_en: 'Black Pepper', label_ko: '블랙페퍼', label_ja: '黒胡椒' }
    ]
  },
  'd109': {
    label: '選擇口味', label_en: 'Select Flavor', label_ko: '맛 선택', label_ja: '味を選択',
    options: [
      { value: '蘑菇', label_en: 'Mushroom', label_ko: '버섯', label_ja: 'マッシュルーム' },
      { value: '黑胡椒', label_en: 'Black Pepper', label_ko: '블랙페퍼', label_ja: '黒胡椒' }
    ]
  },
  'd84': {
    label: '選擇種類', label_en: 'Select Type', label_ko: '종류 선택', label_ja: '種類を選択',
    options: [
      { value: '白饅頭', label_en: 'Plain Bun', label_ko: '흰 만터우', label_ja: '白マントウ' },
      { value: '黑糖饅頭', label_en: 'Brown Sugar Bun', label_ko: '흑설탕 만터우', label_ja: '黒糖マントウ' }
    ]
  },
  'd87': {
    label: '選擇種類', label_en: 'Select Type', label_ko: '종류 선택', label_ja: '種類を選択',
    options: [
      { value: '白饅頭', label_en: 'Plain Bun', label_ko: '흰 만터우', label_ja: '白マントウ' },
      { value: '黑糖饅頭', label_en: 'Brown Sugar Bun', label_ko: '흑설탕 만터우', label_ja: '黒糖マントウ' }
    ]
  },
  'd108': {
    label: '選擇醬料', label_en: 'Select Sauce', label_ko: '소스 선택', label_ja: 'ソースを選択',
    options: [
      { value: '加醬油', label_en: 'Soy Sauce', label_ko: '간장 추가', label_ja: '醤油' },
      { value: '加辣椒醬', label_en: 'Chili Sauce', label_ko: '고추장 추가', label_ja: 'チリソース' },
      { value: '都要', label_en: 'Both', label_ko: '모두', label_ja: '両方' },
      { value: '都不要', label_en: 'None', label_ko: '없음', label_ja: 'なし' }
    ]
  },
  // === 盈螢早點 — 加蛋 ===
  'a3': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加蛋', extraPrice: 15, label_en: 'Add Egg', label_ko: '계란 추가', label_ja: '卵追加' }
  ]},
  'a5': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加蛋', extraPrice: 15, label_en: 'Add Egg', label_ko: '계란 추가', label_ja: '卵追加' }
  ]},
  'a10': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加蛋', extraPrice: 15, label_en: 'Add Egg', label_ko: '계란 추가', label_ja: '卵追加' }
  ]},
  'a12': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加蛋', extraPrice: 15, label_en: 'Add Egg', label_ko: '계란 추가', label_ja: '卵追加' }
  ]},
  'a17': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加蛋', extraPrice: 15, label_en: 'Add Egg', label_ko: '계란 추가', label_ja: '卵追加' }
  ]},
  // === 東方美 — 薄片/厚片 ===
  'c16': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'c18': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'c20': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'c22': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'c24': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'c26': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'c28': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'c30': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  // === 東方美 — 鐵板麵 / 鍋燒麵 ===
  'c73': {
    label: '選擇口味', label_en: 'Select Flavor', label_ko: '맛 선택', label_ja: '味を選択',
    options: [
      { value: '黑胡椒', extraPrice: 0, label_en: 'Black Pepper', label_ko: '블랙페퍼', label_ja: '黒胡椒' },
      { value: '蘑菇', extraPrice: 0, label_en: 'Mushroom', label_ko: '버섯', label_ja: 'マッシュルーム' }
    ]
  },
  'c75': {
    label: '選擇麵條', label_en: 'Select Noodle', label_ko: '면 선택', label_ja: '麺を選択',
    options: [
      { value: '意麵', extraPrice: 0, label_en: 'Yi Mein', label_ko: '이면', label_ja: '意麵' },
      { value: '冬粉', extraPrice: 0, label_en: 'Glass Noodle', label_ko: '당면', label_ja: '春雨' },
      { value: '雞絲麵', extraPrice: 0, label_en: 'Chicken Noodle', label_ko: '치킨 누들', label_ja: '鶏糸麺' }
    ]
  },
  // === 三隻小兔 — 加起司（漢堡）===
  'd1': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd3': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd5': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd7': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd9': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd11': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd13': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd15': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd17': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd19': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd21': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd23': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd25': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  // === 三隻小兔 — 加起司（土司）===
  'd27': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd29': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd31': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd33': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd35': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd37': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd39': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd41': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd43': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd45': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd47': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  'd49': { label: '選擇配料', label_en: 'Select Add-on', label_ko: '추가 선택', label_ja: 'トッピング選択', options: [
    { value: '原味', extraPrice: 0, label_en: 'Original', label_ko: '오리지널', label_ja: 'オリジナル' },
    { value: '加起司', extraPrice: 10, label_en: 'Add Cheese', label_ko: '치즈 추가', label_ja: 'チーズ追加' }
  ]},
  // === 三隻小兔 — 薄片/厚片 ===
  'd51': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 5, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'd53': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 5, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'd55': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 10, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'd57': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 10, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  'd59': { label: '選擇厚度', label_en: 'Thickness', label_ko: '두께 선택', label_ja: '厚さ選択', options: [
    { value: '薄片', extraPrice: 0, label_en: 'Thin', label_ko: '얇은', label_ja: '薄切り' },
    { value: '厚片', extraPrice: 15, label_en: 'Thick', label_ko: '두꺼운', label_ja: '厚切り' }
  ]},
  // === 三隻小兔 — 一般/特酥（蛋餅）===
  'd61': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd63': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd65': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd67': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd69': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd71': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd73': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd75': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd77': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd79': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]},
  'd81': { label: '選擇餅皮', label_en: 'Select Crust', label_ko: '피 선택', label_ja: '皮を選択', options: [
    { value: '一般', extraPrice: 0, label_en: 'Normal', label_ko: '일반', label_ja: '通常' },
    { value: '特酥', extraPrice: 10, label_en: 'Extra Crispy', label_ko: '바삭', label_ja: '特酥' }
  ]}
};

// --- 後台拆解套餐對照表 (COMBO MAPPING) ---
const COMBO_MAPPING = {
  // 盈螢早點
  'a201': { 'a1': 1, 'a2': 1, 'a9': 1 },
  'a202': { 'a3_custom:加蛋': 1, 'a10_custom:加蛋': 1 },
  'a203': { 'a17_custom:加蛋': 1, 'a7': 1, 'a12_custom:原味': 1 },
  'a204': { 'a5_custom:加蛋': 1, 'a8': 1, 'a13': 1 },
  'a205': { 'a1': 2, 'a26': 2 },
  // 新協隆早餐
  'b201': { 'b1': 2, 'b11': 1 },
  'b202': { 'b6': 1, 'b10': 1, 'b7': 1 },
  'b203': { 'b9': 2, 'b3': 1 },
  'b204': { 'b4': 1, 'b5': 1, 'b8': 1 },
  'b205': { 'b2': 2, 'b10': 1 },
  // 東方美
  'c201': { 'c3': 1, 'c35': 1, 'c69': 1 },
  'c202': { 'c15': 1, 'c73_custom:黑胡椒': 1 },
  'c203': { 'c52': 1, 'c71': 1, 'c70': 1 },
  'c204': { 'c72': 2 },
  'c205': { 'c75_custom:意麵': 1, 'c61': 1, 'c62': 1 }
};

// --- Utils ---
const getBaseId = (id) => id.split('_')[0];
const getTempLabel = (id, lang) => {
  if (id.endsWith('_ice')) return lang === 'zh' ? '(冰)' : lang === 'en' ? '(Ice)' : lang === 'ja' ? '(アイス)' : '(아이스)';
  if (id.endsWith('_warm')) return lang === 'zh' ? '(溫)' : lang === 'en' ? '(Warm)' : lang === 'ja' ? '(ホット)' : '(따뜻한)';
  return '';
};

const getCustomLabel = (id, lang = 'zh') => {
  const match = id.match(/^(.+?)_custom:(.+)$/);
  if (!match) return '';
  const [, baseId, optionValue] = match;
  if (optionValue === '原味') return '';

  const config = CUSTOMIZATION_OPTIONS[baseId];
  if (config) {
    const opt = config.options.find(o => o.value === optionValue);
    if (opt) {
      if (lang === 'zh') return `(${opt.value})`;
      if (lang === 'en' && opt.label_en) return `(${opt.label_en})`;
      if (lang === 'ja' && opt.label_ja) return `(${opt.label_ja})`;
      if (lang === 'ko' && opt.label_ko) return `(${opt.label_ko})`;
    }
  }
  return `(${optionValue})`;
};

const getExtraPrice = (cartKey) => {
  const match = cartKey.match(/^(.+?)_custom:(.+)$/);
  if (!match) return 0;
  const [, itemId, optionValue] = match;
  const config = CUSTOMIZATION_OPTIONS[itemId];
  if (!config) return 0;
  const opt = config.options.find(o => o.value === optionValue);
  return opt && opt.extraPrice ? opt.extraPrice : 0;
};

const flattenItems = (items) => {
  const result = {};
  Object.entries(items).forEach(([itemId, qty]) => {
    const baseId = getBaseId(itemId);
    if (COMBO_MAPPING[baseId]) {
      Object.entries(COMBO_MAPPING[baseId]).forEach(([subItemId, subQty]) => {
        result[subItemId] = (result[subItemId] || 0) + (subQty * qty);
      });
    } else {
      result[itemId] = (result[itemId] || 0) + qty;
    }
  });
  return result;
};

// --- Modals ---
const AdminLoginModal = ({ isOpen, onClose, onLogin }) => {
  const [pin, setPin] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 border border-[#8E806A]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#595045]">管理員登入</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={e => setPin(e.target.value)}
          className="w-full text-center text-2xl border-2 border-[#EBE8E1] rounded-lg py-2 mb-6"
          placeholder="****"
        />
        <button onClick={() => { onLogin(pin); }} className="w-full bg-[#8E806A] text-white py-3 rounded-lg font-bold">確認</button>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl w-full max-w-xs p-6 border-t-4 border-red-500">
        <div className="flex flex-col items-center mb-4"><AlertTriangle className="text-red-500 mb-2" size={32} /><h3 className="text-lg font-bold text-[#595045]">確認清除</h3></div>
        <p className="text-gray-600 text-center mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 py-2 rounded-lg font-bold">取消</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold">確認刪除</button>
        </div>
      </div>
    </div>
  );
};

const LinkGeneratorModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const baseUrl = window.location.href.split('?')[0];
  const links = [
    { name: "通用版", url: baseUrl, desc: "可選店家" },
    { name: "盈螢專用", url: `${baseUrl}?shop=shopA`, desc: "鎖定盈螢" },
    { name: "新協隆專用", url: `${baseUrl}?shop=shopB`, desc: "鎖定新協隆" },
    { name: "東方美專用", url: `${baseUrl}?shop=shopC`, desc: "鎖定東方美" },
    { name: "三隻小兔專用", url: `${baseUrl}?shop=shopD`, desc: "鎖定三隻小兔" }
  ];
  const copy = (t) => {
    const el = document.createElement('textarea');
    el.value = t;
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      window.customAlert("已複製連結");
    } catch (err) {
      window.customAlert("複製失敗");
    }
    document.body.removeChild(el);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold flex gap-2"><LinkIcon size={20}/> 點餐連結</h3><button onClick={onClose}><X/></button></div>
        <div className="space-y-3">{links.map((l, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded border"><div className="flex justify-between mb-1"><span className="font-bold">{l.name}</span><button onClick={() => copy(l.url)} className="text-sm bg-white border px-2 rounded flex gap-1"><Copy size={12}/>複製</button></div><div className="text-xs text-gray-500 break-all">{l.url}</div></div>
        ))}</div>
      </div>
    </div>
  );
};

const PermissionFixModal = ({ isOpen }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4 flex gap-2"><AlertTriangle/> 資料庫鎖住了</h2>
        <p className="mb-2">請至 Firebase Console &gt; Firestore &gt; 規則，貼上：</p>
        <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs mb-4">allow read, write: if request.auth != null;</pre>
        <p className="text-sm text-gray-500">修改後請重新整理網頁。</p>
      </div>
    </div>
  );
};

const notificationAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// --- Views ---
const GuestView = ({ orders, forcedShopId, user, lang, setLang }) => {
  const [selectedRoom, setSelectedRoom] = useState("");
  const [activeShop, setActiveShop] = useState(forcedShopId || 'shopA');
  const [cart, setCart] = useState({});
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeDrink, setActiveDrink] = useState(null);
  const [activeCustomItem, setActiveCustomItem] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRoomTotalModalOpen, setIsRoomTotalModalOpen] = useState(false);

  const currentOrderRef = useRef({ id: null, updatedAt: null, initialCart: {} });
  const cartRef = useRef({});
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const t = UI_TEXT[lang] || UI_TEXT['zh'];
  const currentRoomOrder = orders.find(o => o.id === selectedRoom);

  useEffect(() => {
    if (!selectedRoom) {
      setCart({});
      setNickname("");
      currentOrderRef.current = { id: null, updatedAt: null, initialCart: {} };
      return;
    }

    const dbOrder = orders.find(o => o.id === selectedRoom);
    const isRoomChanged = currentOrderRef.current.id !== selectedRoom;
    const isOrderUpdatedRemotely = dbOrder && dbOrder.updatedAt !== currentOrderRef.current.updatedAt;

    if (isRoomChanged) {
      const devOrder = dbOrder?.deviceOrders?.[user?.uid] || {};
      setCart(devOrder.items || {});
      setNickname(devOrder.nickname || "");
      currentOrderRef.current = {
        id: selectedRoom,
        updatedAt: dbOrder ? dbOrder.updatedAt : null,
        initialCart: devOrder.items || {}
      };
    } else if (isOrderUpdatedRemotely) {
      const remoteItems = dbOrder?.deviceOrders?.[user?.uid]?.items || {};
      const localCart = cartRef.current;
      const initial = currentOrderRef.current.initialCart || {};

      const mergedCart = { ...remoteItems };

      Object.keys(localCart).forEach(id => {
        const diff = localCart[id] - (initial[id] || 0);
        if (diff !== 0) {
          mergedCart[id] = (mergedCart[id] || 0) + diff;
        }
      });
      Object.keys(initial).forEach(id => {
        if (!localCart[id] && initial[id] > 0) {
          mergedCart[id] = (mergedCart[id] || 0) - initial[id];
        }
      });

      Object.keys(mergedCart).forEach(id => {
        if (mergedCart[id] <= 0) delete mergedCart[id];
      });

      setCart(mergedCart);
      currentOrderRef.current = {
        id: selectedRoom,
        updatedAt: dbOrder.updatedAt,
        initialCart: remoteItems
      };
    }
  }, [selectedRoom, orders, user?.uid]);

  const updateQty = (id, delta) => {
    setCart(prev => {
      const next = { ...prev, [id]: (prev[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const handleExactQty = (id, value) => {
    if (!selectedRoom) return window.customAlert(t.alertSelectRoom);
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setCart(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setCart(prev => ({ ...prev, [id]: parsed }));
    }
  };

  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const baseId = getBaseId(id);
    const item = MENU_MAP[baseId];
    if (!item) return sum;
    const extra = getExtraPrice(id);
    return sum + (item.price + extra) * qty;
  }, 0);

  const submit = async () => {
    if (!selectedRoom) return window.customAlert(t.alertSelectRoom);
    if (totalQty === 0) return;
    if (!user || !user.uid) return window.customAlert("無法取得使用者 ID，請重整網頁。");
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', selectedRoom);
      const localCart = cartRef.current;

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(docRef);
        let data = sfDoc.exists() ? sfDoc.data() : { roomNumber: selectedRoom, items: {}, totalPrice: 0, deviceOrders: {} };
        if (!data.deviceOrders) data.deviceOrders = {};

        const cleanLocalCart = {};
        Object.keys(localCart).forEach(id => {
          if (localCart[id] > 0) cleanLocalCart[id] = localCart[id];
        });

        data.deviceOrders[user.uid] = { 
          items: cleanLocalCart,
          updatedAt: new Date().toISOString(),
          nickname: nickname.trim()
        };

        let newItems = {};
        let newTotalPrice = 0;

        Object.values(data.deviceOrders).forEach(deviceOrder => {
          const devItems = deviceOrder.items || {};
          Object.entries(devItems).forEach(([id, qty]) => {
            newItems[id] = (newItems[id] || 0) + qty;
            const baseId = getBaseId(id);
            const item = MENU_MAP[baseId];
            if (item) {
              const extra = getExtraPrice(id);
              newTotalPrice += (item.price + extra) * qty;
            }
          });
        });

        transaction.set(docRef, {
          ...data,
          roomNumber: selectedRoom,
          items: newItems,
          totalPrice: newTotalPrice,
          timestamp: serverTimestamp(),
          updatedAt: new Date().toISOString()
        });
      });

      currentOrderRef.current.initialCart = { ...localCart };
      setSubmitted(true);
    } catch (e) { window.customAlert(t.alertNetwork + ": " + e.message); }
    setIsSubmitting(false);
  };

  const confirmCancelOrder = async () => {
    if (!user || !user.uid) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', selectedRoom);
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(docRef);
        if (!sfDoc.exists()) return;
        let data = sfDoc.data();
        if (!data.deviceOrders || !data.deviceOrders[user.uid]) return;

        delete data.deviceOrders[user.uid];

        if (Object.keys(data.deviceOrders).length === 0) {
          transaction.delete(docRef);
          return;
        }

        let newItems = {};
        let newTotalPrice = 0;
        Object.values(data.deviceOrders).forEach(deviceOrder => {
          const devItems = deviceOrder.items || {};
          Object.entries(devItems).forEach(([id, qty]) => {
            newItems[id] = (newItems[id] || 0) + qty;
            const baseId = getBaseId(id);
            const item = MENU_MAP[baseId];
            if (item) {
              const extra = getExtraPrice(id);
              newTotalPrice += (item.price + extra) * qty;
            }
          });
        });

        transaction.update(docRef, {
          deviceOrders: data.deviceOrders,
          items: newItems,
          totalPrice: newTotalPrice,
          updatedAt: new Date().toISOString()
        });
      });
      setCart({});
      setIsCancelModalOpen(false);
    } catch(e) { window.customAlert(t.alertNetwork + ": " + e.message); }
    setIsSubmitting(false);
  };

  const getShopName = (s) => lang === 'zh' ? s.name.slice(0,4) : lang === 'ko' ? s.name_ko : lang === 'ja' ? s.name_ja : s.name_en;
  const getItemName = (i) => lang === 'zh' ? i.name : lang === 'ko' ? i.name_ko : lang === 'ja' ? i.name_ja : i.name_en;

  if (submitted) return (
    <div className="flex flex-col items-center min-h-[70vh] p-6 pb-20">
      <div className="flex flex-col items-center justify-center text-center mt-10 mb-6">
        <CheckCircle className="w-16 h-16 text-[#8C9A86] mb-3" />
        <h2 className="text-2xl font-bold text-[#595045] mb-2">{t.successTitle}</h2>
        <p className="text-gray-500">{t.successMsg}</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden mb-8">
        <div className="bg-[#8E806A] text-white px-4 py-2 flex justify-between items-center">
          <span className="font-bold text-sm flex items-center gap-1"><ClipboardList size={14}/> {nickname.trim() ? `${nickname.trim()}${t.nicknameReceiptSuffix}` : t.personalReceiptTitle}</span>
          <span className="text-xs opacity-80">{selectedRoom}{t.roomSuffix}</span>
        </div>
        <div className="p-4 bg-gray-50 space-y-2">
          {Object.entries(cart).map(([id, qty]) => {
            const baseId = getBaseId(id);
            const item = MENU_MAP[baseId];
            if (!item) return null;
            const extra = getExtraPrice(id);
            const price = (item.price + extra) * qty;
            const suffix = getTempLabel(id, lang);
            const customSuffix = getCustomLabel(id, lang);
            return (
              <div key={id} className="flex justify-between items-start text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-[#595045]">{getItemName(item)}</div>
                  {(suffix || customSuffix) && <div className="text-xs text-gray-500">{suffix}{customSuffix}</div>}
                </div>
                <div className="flex items-center gap-3 text-[#595045]">
                  <span className="text-xs bg-gray-200 px-1.5 rounded">x{qty}</span>
                  <span className="font-bold w-10 text-right">${price}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-3 bg-[#EBE8E1]/30 border-t flex justify-between items-center font-bold text-[#595045]">
          <span>{t.personalSubtotal}</span>
          <span className="text-lg text-[#8E806A]">${totalPrice}</span>
        </div>
      </div>

      <div className="w-full max-w-sm mb-4 px-2">
        <p className="text-xs text-gray-500 text-center">{t.roomSharedDisclaimer}</p>
      </div>

      <div className="w-full max-w-sm mb-8 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm">
        <span>{t.receiptReminder}</span>
      </div>

      <div className="w-full max-w-sm mb-4 px-2">
        <p className="text-sm text-gray-500 mt-4 text-center">{t.modifyHint}</p>
      </div>

      <button onClick={() => setSubmitted(false)} className="px-10 py-3 bg-[#8E806A] text-white font-bold rounded-full shadow-sm hover:bg-[#7a6d59] transition-colors">{t.backHome}</button>
    </div>
  );

  const displayShops = forcedShopId ? SHOPS.filter(s => s.id === forcedShopId) : SHOPS;
  const items = MENU_ITEMS.filter(i => i.shopId === activeShop && !i.isPersonalOnly);

  const categoryOrder = ['雙人套餐', '漢堡類', '吐司類', '蛋餅類', '麵類', '單點小食', '飲料類', '其他'];
  const groupedItems = items.reduce((acc, i) => {
    const cat = i.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(i);
    return acc;
  }, {});
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    let ia = categoryOrder.indexOf(a);
    let ib = categoryOrder.indexOf(b);
    if (ia === -1) ia = 99;
    if (ib === -1) ib = 99;
    return ia - ib;
  });

  return (
    <div className="max-w-md mx-auto min-h-screen pb-32">
      <div className="bg-[#8E806A] text-white p-3 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h1 className="font-bold flex gap-2 items-center"><Coffee size={18}/> {t.title}</h1>
          <div className="flex items-center gap-2">
            <div className="bg-[#A69986] px-2 py-1 rounded text-xs flex items-center gap-1 relative border border-white/40 shadow-sm cursor-pointer hover:bg-[#8E806A] transition-colors">
              <Globe size={12}/>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-white text-base outline-none cursor-pointer appearance-none pr-4 relative z-10 w-full"
              >
                <option value="zh" className="text-gray-800">中文</option>
                <option value="en" className="text-gray-800">English</option>
                <option value="ja" className="text-gray-800">日本語</option>
                <option value="ko" className="text-gray-800">한국어</option>
              </select>
              <ChevronDown size={14} className="absolute right-1 text-white pointer-events-none" />
            </div>
            <span className="text-xs bg-[#A69986] px-2 py-1 rounded">{t.subtitle}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-[#FDFCFB] p-1 rounded w-4/12 flex items-center"><Users size={14} className="text-[#8E806A] mr-1"/>
            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="bg-transparent font-bold text-base text-[#595045] w-full outline-none">
              <option value="" disabled>{t.selectRoom}</option>
              {ROOMS.map(r => <option key={r} value={r}>{r}{t.roomSuffix}</option>)}
            </select>
          </div>
          <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">{displayShops.map(s => (
            <button key={s.id} onClick={() => !forcedShopId && setActiveShop(s.id)} className={`flex-1 min-w-max text-xs py-1 px-1 rounded border ${activeShop === s.id ? 'bg-white text-[#595045]' : 'bg-[#A69986] text-white border-transparent'}`}>{getShopName(s)}</button>
          ))}</div>
        </div>
      </div>

      <div className="p-2">
        {sortedCategories.map(cat => (
          <div key={cat} className="mb-4">
            <h2 className="font-bold text-[#8E806A] mb-2 px-1 text-[13px]">{(CATEGORY_TEXT[cat] && CATEGORY_TEXT[cat][lang]) || cat}</h2>
            <div className="grid grid-cols-3 gap-2">
              {groupedItems[cat].map(i => {
                const isDrink = i.hasTemp;
                const isCustom = !!CUSTOMIZATION_OPTIONS[i.id];
                const qtyIce = cart[i.id + '_ice'] || 0;
                const qtyWarm = cart[i.id + '_warm'] || 0;
                const customQty = isCustom ? Object.entries(cart).filter(([k]) => k.startsWith(i.id + '_custom:')).reduce((s, [,v]) => s + v, 0) : 0;
                const qty = isDrink ? qtyIce + qtyWarm : isCustom ? customQty : (cart[i.id] || 0);

                return (
                  <div key={i.id} className={`bg-white border p-1.5 rounded flex flex-col justify-between ${qty ? 'border-[#8E806A] ring-1 ring-[#8E806A]/30' : 'border-gray-100'}`}>
                    <div className="mb-1">
                      <h3 className="font-bold text-[11px] text-[#595045] mb-0.5 leading-tight">{getItemName(i)}</h3>
                      <p className="text-[10px] text-gray-400">${i.price}</p>
                    </div>
                    <div className="flex justify-between bg-gray-50 rounded p-0.5 mt-auto">
                      {isDrink ? (
                        <button
                          onClick={() => selectedRoom ? setActiveDrink(i) : window.customAlert(t.alertSelectRoom)}
                          className={`w-full text-[11px] py-1 font-bold rounded ${qty > 0 ? 'bg-white text-[#8E806A] shadow-sm' : 'text-gray-500'}`}
                        >
                          {qty > 0 ? `${t.selected} ${qty}` : t.selectTemp}
                        </button>
                      ) : isCustom ? (
                        <button
                          onClick={() => selectedRoom ? setActiveCustomItem(i) : window.customAlert(t.alertSelectRoom)}
                          className={`w-full text-[11px] py-1 font-bold rounded ${qty > 0 ? 'bg-white text-[#8E806A] shadow-sm' : 'text-gray-500'}`}
                        >
                          {qty > 0 ? `${t.selected} ${qty}` : (lang === 'en' ? CUSTOMIZATION_OPTIONS[i.id].label_en : lang === 'ko' ? CUSTOMIZATION_OPTIONS[i.id].label_ko : lang === 'ja' ? CUSTOMIZATION_OPTIONS[i.id].label_ja : CUSTOMIZATION_OPTIONS[i.id].label)}
                        </button>
                      ) : (
                        <>
                          <button onClick={() => selectedRoom ? updateQty(i.id, -1) : window.customAlert(t.alertSelectRoom)} disabled={!qty} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 disabled:opacity-30">-</button>
                          <input type="number" value={qty || ""} onChange={(e) => handleExactQty(i.id, e.target.value)} className={`text-base font-bold w-8 text-center bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none flex items-center justify-center ${qty ? 'text-[#8E806A]' : 'text-gray-300'}`} />
                          <button onClick={() => selectedRoom ? updateQty(i.id, 1) : window.customAlert(t.alertSelectRoom)} className="w-5 h-5 bg-white shadow-sm rounded text-[#8E806A]">+</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 border-t p-3 max-w-md mx-auto flex flex-col gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <input 
          type="text" 
          value={nickname} 
          onChange={e => setNickname(e.target.value)} 
          placeholder={t.nicknamePlaceholder} 
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-base text-[#595045] focus:outline-none focus:border-[#8E806A] focus:ring-1 focus:ring-[#8E806A]"
          maxLength={15}
        />
        <div className="flex justify-between gap-3">
          <div className="text-xs text-gray-500 flex flex-col justify-center">
            <div>{selectedRoom || "-"} • {totalQty}</div>
            <div className="text-xl font-bold text-[#8E806A]">${totalPrice}</div>
            {selectedRoom && (
              <button 
                onClick={() => setIsRoomTotalModalOpen(true)} 
                className="inline-flex items-center justify-center gap-1.5 w-max mt-1 px-3 py-1.5 bg-gray-100 text-[#595045] rounded-full text-xs font-medium cursor-pointer active:bg-gray-200 transition-colors shadow-sm border border-gray-200"
              >
                <ClipboardList size={14} className="text-[#8E806A]" />
                {t.roomTotalBtn}
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-1">
            {orders.some(o => o.roomNumber === selectedRoom) && (
              <button onClick={() => setIsCancelModalOpen(true)} disabled={isSubmitting} className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold disabled:opacity-50 shadow-sm">{t.cancelOrder}</button>
            )}
            <button onClick={submit} disabled={!totalQty || isSubmitting} className="bg-[#8E806A] text-white px-6 py-2 rounded-lg font-bold flex-1 disabled:opacity-50 shadow-sm">{isSubmitting ? '...' : t.submit}</button>
          </div>
        </div>
      </div>

      {activeDrink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl w-full max-w-xs p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-2 border-b">
              <h3 className="font-bold text-[#595045]">{getItemName(activeDrink)}</h3>
              <button onClick={() => setActiveDrink(null)}><X size={20} className="text-gray-400"/></button>
            </div>

            <div className="flex justify-between items-center mb-5 bg-blue-50 p-3 rounded-lg">
              <span className="font-bold text-blue-800">{t.iceLabel}</span>
              <div className="flex items-center gap-3 bg-white p-1 rounded shadow-sm">
                <button onClick={() => updateQty(activeDrink.id + '_ice', -1)} disabled={!(cart[activeDrink.id + '_ice'])} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 disabled:opacity-30 font-bold">-</button>
                <input type="number" value={cart[activeDrink.id + '_ice'] || ""} onChange={(e) => handleExactQty(activeDrink.id + '_ice', e.target.value)} className="w-8 text-base text-center font-bold text-[#8E806A] bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <button onClick={() => updateQty(activeDrink.id + '_ice', 1)} className="w-6 h-6 flex items-center justify-center rounded bg-[#8E806A] text-white font-bold">+</button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 bg-orange-50 p-3 rounded-lg">
              <span className="font-bold text-orange-800">{t.warmLabel}</span>
              <div className="flex items-center gap-3 bg-white p-1 rounded shadow-sm">
                <button onClick={() => updateQty(activeDrink.id + '_warm', -1)} disabled={!(cart[activeDrink.id + '_warm'])} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 disabled:opacity-30 font-bold">-</button>
                <input type="number" value={cart[activeDrink.id + '_warm'] || ""} onChange={(e) => handleExactQty(activeDrink.id + '_warm', e.target.value)} className="w-8 text-base text-center font-bold text-[#8E806A] bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <button onClick={() => updateQty(activeDrink.id + '_warm', 1)} className="w-6 h-6 flex items-center justify-center rounded bg-[#8E806A] text-white font-bold">+</button>
              </div>
            </div>

            <button onClick={() => setActiveDrink(null)} className="w-full bg-[#8E806A] text-white py-3 rounded-lg font-bold shadow-md">{t.done}</button>
          </div>
        </div>
      )}

      {activeCustomItem && CUSTOMIZATION_OPTIONS[activeCustomItem.id] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl w-full max-w-xs p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-2 border-b">
              <h3 className="font-bold text-[#595045]">{getItemName(activeCustomItem)}</h3>
              <button onClick={() => setActiveCustomItem(null)}><X size={20} className="text-gray-400"/></button>
            </div>
            {CUSTOMIZATION_OPTIONS[activeCustomItem.id].options.map((opt, idx) => {
              const cartKey = activeCustomItem.id + '_custom:' + opt.value;
              const optQty = cart[cartKey] || 0;
              const bgColors = ['bg-amber-50', 'bg-purple-50', 'bg-teal-50', 'bg-rose-50'];
              const textColors = ['text-amber-800', 'text-purple-800', 'text-teal-800', 'text-rose-800'];
              return (
                <div key={opt.value} className={`flex justify-between items-center mb-3 ${bgColors[idx % 4]} p-3 rounded-lg`}>
                  <span className={`font-bold ${textColors[idx % 4]}`}>
                    {(lang === 'en' ? opt.label_en : lang === 'ko' ? opt.label_ko : lang === 'ja' ? opt.label_ja : opt.value) + (opt.extraPrice ? ` (+$${opt.extraPrice})` : '')}
                  </span>
                  <div className="flex items-center gap-3 bg-white p-1 rounded shadow-sm">
                    <button onClick={() => updateQty(cartKey, -1)} disabled={!optQty} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 disabled:opacity-30 font-bold">-</button>
                    <input type="number" value={optQty || ""} onChange={(e) => handleExactQty(cartKey, e.target.value)} className="w-8 text-base text-center font-bold text-[#8E806A] bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    <button onClick={() => updateQty(cartKey, 1)} className="w-6 h-6 flex items-center justify-center rounded bg-[#8E806A] text-white font-bold">+</button>
                  </div>
                </div>
              );
            })}
            <button onClick={() => setActiveCustomItem(null)} className="w-full bg-[#8E806A] text-white py-3 rounded-lg font-bold shadow-md">{t.done}</button>
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl max-w-xs w-full p-6 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-[#595045] mb-2">{t.modalCancelTitle}</h3>
            <p className="text-gray-600 text-sm mb-6">{t.alertCancelConfirm}</p>
            <div className="flex gap-3">
              <button onClick={() => setIsCancelModalOpen(false)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-bold transition-colors">{t.modalBtnNo}</button>
              <button onClick={confirmCancelOrder} disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50">{t.modalBtnYes}</button>
            </div>
          </div>
        </div>
      )}

      {isRoomTotalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#FAF9F6] rounded-xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b bg-white">
              <h3 className="font-bold text-[#595045]">{t.roomTotalTitle} - {selectedRoom}{t.roomSuffix}</h3>
              <button onClick={() => setIsRoomTotalModalOpen(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3">
              {(!currentRoomOrder || !currentRoomOrder.deviceOrders || Object.keys(currentRoomOrder.deviceOrders).length === 0) ? (
                <div className="text-center py-10 opacity-50">{t.emptyRoomOrder}</div>
              ) : (
                Object.keys(currentRoomOrder.deviceOrders).sort().map((uid, idx) => {
                  const deviceOrder = currentRoomOrder.deviceOrders[uid];
                  const deviceLetter = String.fromCharCode(65 + idx);
                  const deviceName = deviceOrder.nickname ? `📱 ${deviceOrder.nickname}` : `📱 ${deviceLetter}裝置`;
                  const d = deviceOrder.updatedAt ? new Date(deviceOrder.updatedAt) : null;
                  const timeStr = d ? `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : '';
                  
                  return (
                    <div key={uid} className="border border-gray-200 rounded-md bg-gray-50 overflow-hidden shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-200 bg-gray-100 px-3 py-1.5">
                        <span className="font-bold text-xs text-[#595045] flex items-center gap-1.5">
                          <Smartphone size={12} className="text-[#8E806A]"/> {deviceName}
                          {timeStr && (
                            <span className="text-[10px] text-gray-400 font-mono font-normal ml-1 flex items-center gap-1">
                              <Clock size={10}/> {timeStr}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="p-2 space-y-1.5 bg-white">
                        {Object.entries(flattenItems(deviceOrder.items)).map(([id, qty]) => {
                          const baseId = getBaseId(id);
                          const item = MENU_MAP[baseId];
                          if (!item) return null;
                          const dotColor = item.shopId === 'shopA' ? 'bg-orange-400' : item.shopId === 'shopB' ? 'bg-blue-400' : item.shopId === 'shopC' ? 'bg-green-500' : 'bg-pink-400';
                          const suffix = getTempLabel(id, lang);
                          const customSuffix = getCustomLabel(id, lang);
                          return (
                            <div key={id} className="flex justify-between text-[13px] items-center">
                              <span className="flex gap-2 items-center">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                <span className="text-[#595045] font-medium">{getItemName(item)}</span> 
                                {(suffix || customSuffix) && <span className="text-gray-400 text-[11px] bg-gray-50 px-1 rounded">{suffix}{customSuffix}</span>}
                              </span>
                              <span className="font-bold text-[#8E806A] bg-gray-100 px-1.5 rounded-sm">x{qty}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {currentRoomOrder && currentRoomOrder.totalPrice > 0 && (
              <div className="bg-white p-4 border-t flex justify-between items-center font-bold">
                <span className="text-[#595045]">{t.total}</span>
                <span className="text-xl text-[#8E806A]">${currentRoomOrder.totalPrice}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const OwnerDashboard = ({ orders }) => {
  const [viewMode, setViewMode] = useState('byRoom');
  const [deleteModal, setDeleteModal] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const captureRef = useRef(null);
  const prevOrdersRef = useRef(orders);

  // 新增個人點單相關狀態
  const [personalCart, setPersonalCart] = useState({});
  const [activePersonalDrink, setActivePersonalDrink] = useState(null);
  const [activePersonalCustomItem, setActivePersonalCustomItem] = useState(null);

  useEffect(() => {
    const prev = prevOrdersRef.current;
    let hasNewOrUpdated = false;

    if (orders.length > 0) {
      for (let i = 0; i < orders.length; i++) {
        const curOrder = orders[i];
        const prevOrder = prev.find(o => o.id === curOrder.id);
        if (!prevOrder || curOrder.updatedAt !== prevOrder.updatedAt) {
          hasNewOrUpdated = true;
          break;
        }
      }
    }

    if (hasNewOrUpdated) {
      notificationAudio.play().catch(e => console.warn("瀏覽器擋下了自動播放：", e));
    }
    prevOrdersRef.current = orders;
  }, [orders]);


  const clearOrders = async () => {
    try {
      const batch = writeBatch(db);
      orders.forEach(o => {
        batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'orders', o.id));
      });
      await batch.commit();
      setDeleteModal(false);
    } catch (e) { console.error(e); window.customAlert("清空失敗：" + e.message); }
  };

  const handleScreenshot = async () => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: '#FAF9F6',
        useCORS: true,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('.is-paid-card').forEach(el => {
            el.classList.remove('bg-green-50', 'border-green-300');
            el.classList.add('bg-white');
          });
          clonedDoc.querySelectorAll('.is-paid-header').forEach(el => {
            el.classList.remove('bg-green-100');
            el.classList.add('bg-gray-50');
          });
          clonedDoc.querySelectorAll('.screenshot-visible').forEach(el => {
            el.classList.remove('hidden');
          });
        }
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `茶雲居_訂單截圖_${new Date().getTime()}.png`;
      link.click();
    } catch (err) {
      console.error("截圖失敗", err);
      window.customAlert("截圖發生錯誤，請稍後再試！");
    }
  };

  const togglePaid = async (roomId, currentIsPaid) => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', roomId),
        { isPaid: !currentIsPaid },
        { merge: true }
      );
    } catch (e) {
      window.customAlert("更新結帳狀態失敗：" + e.message);
    }
  };

  const deleteSingleOrder = async (roomId) => {
    if (window.confirm(`確定要刪除 ${roomId} 房的訂單嗎？`)) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', roomId));
      } catch(e) {
        window.customAlert("刪除失敗：" + e.message);
      }
    }
  };

  const deleteDeviceOrder = async (roomId, uid, deviceName) => {
    if (window.confirm(`確定要刪除 ${deviceName} 的訂單嗎？`)) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', roomId);
        await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(docRef);
          if (!sfDoc.exists()) return;
          let data = sfDoc.data();
          if (!data.deviceOrders || !data.deviceOrders[uid]) return;

          delete data.deviceOrders[uid];

          if (Object.keys(data.deviceOrders).length === 0) {
            transaction.delete(docRef);
            return;
          }

          let newItems = {};
          let newTotalPrice = 0;
          Object.values(data.deviceOrders).forEach(deviceOrder => {
            const devItems = deviceOrder.items || {};
            Object.entries(devItems).forEach(([id, qty]) => {
              newItems[id] = (newItems[id] || 0) + qty;
              const baseId = getBaseId(id);
              const item = MENU_MAP[baseId];
              if (item) {
                const extra = getExtraPrice(id);
                newTotalPrice += (item.price + extra) * qty;
              }
            });
          });

          transaction.update(docRef, {
            deviceOrders: data.deviceOrders,
            items: newItems,
            totalPrice: newTotalPrice,
            updatedAt: new Date().toISOString()
          });
        });
      } catch(e) {
        window.customAlert("刪除裝置訂單失敗：" + e.message);
      }
    }
  };

  const stats = useMemo(() => {
    let total = 0;
    const s = { shopA: {}, shopB: {}, shopC: {}, shopD: {} };
    const shopTotals = { shopA: 0, shopB: 0, shopC: 0, shopD: 0 };

    orders.forEach(o => {
      total += (o.totalPrice || 0);

      Object.entries(o.items || {}).forEach(([id, qty]) => {
        const baseId = getBaseId(id);
        const item = MENU_MAP[baseId];
        if (item) {
          const extra = getExtraPrice(id);
          shopTotals[item.shopId] += (item.price + extra) * qty;
        }
      });

      const expandedItems = flattenItems(o.items || {});
      Object.entries(expandedItems).forEach(([id, qty]) => {
        const baseId = getBaseId(id);
        const item = MENU_MAP[baseId];
        if (item) {
          if (!s[item.shopId][id]) s[item.shopId][id] = { ...item, originalId: id, q: 0 };
          s[item.shopId][id].q += qty;
        }
      });
    });
    return { s, total, shopTotals };
  }, [orders]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  // --- 個人點單功能 ---
  const updatePersonalQty = (id, delta) => {
    setPersonalCart(prev => {
      const next = { ...prev, [id]: (prev[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const handlePersonalExactQty = (id, value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setPersonalCart(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setPersonalCart(prev => ({ ...prev, [id]: parsed }));
    }
  };

  const personalTotalQty = Object.values(personalCart).reduce((a, b) => a + b, 0);
  const personalTotalPrice = Object.entries(personalCart).reduce((sum, [id, qty]) => {
    const baseId = getBaseId(id);
    const item = MENU_MAP[baseId];
    if (!item) return sum;
    const extra = getExtraPrice(id);
    return sum + (item.price + extra) * qty;
  }, 0);

  const generatePersonalOrderText = () => {
    if (Object.keys(personalCart).length === 0) return window.customAlert("購物車是空的，請先選擇餐點");
    let text = "";
    Object.entries(personalCart).forEach(([id, qty]) => {
      const baseId = getBaseId(id);
      const item = MENU_MAP[baseId];
      if (item) {
        const suffix = getTempLabel(id, 'zh');
        const customSuffix = getCustomLabel(id);
        const fullSuffix = suffix || customSuffix;
        text += `${item.name}${fullSuffix ? ' ' + fullSuffix : ''} x${qty}\n`;
      }
    });
    text = text.trim();

    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      window.customAlert("點餐內容已複製，可直接貼上至 Line 傳送！\n\n預覽內容：\n" + text);
    } catch (err) {
      window.customAlert("複製失敗，請檢查瀏覽器權限");
    }
    document.body.removeChild(el);
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen text-[#595045] bg-[#FAF9F6]">
      <div className="bg-[#4A453E] text-white p-4 sticky top-0 z-20 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h1 className="font-bold flex gap-2"><ClipboardList/> 後台系統</h1>
          <div className="flex gap-2 items-center">
            <button onClick={() => setLinkModal(true)} className="flex gap-1 text-xs border border-transparent hover:border-white px-2 py-1 rounded"><LinkIcon size={14}/> 連結</button>
            {viewMode !== 'personal' && <span className="text-xs bg-[#8E806A] px-2 py-1 rounded">${stats.total}</span>}
            <button onClick={() => setDeleteModal(true)} className="hover:text-red-300 ml-2"><Trash2 size={18}/></button>
          </div>
        </div>
        <div className="flex bg-[#38342F] p-1 rounded w-full gap-1 overflow-x-auto no-scrollbar">
          <button onClick={() => setViewMode('byRoom')} className={`flex-1 text-sm py-1.5 px-2 rounded min-w-max transition-colors ${viewMode === 'byRoom' ? 'bg-[#8E806A] font-bold text-white shadow-sm' : 'text-gray-300 hover:bg-[#5a544b]'}`}>依房間</button>
          <button onClick={() => setViewMode('byItem')} className={`flex-1 text-sm py-1.5 px-2 rounded min-w-max transition-colors ${viewMode === 'byItem' ? 'bg-[#8E806A] font-bold text-white shadow-sm' : 'text-gray-300 hover:bg-[#5a544b]'}`}>依品項</button>
          <button onClick={() => setViewMode('personal')} className={`flex-1 text-sm py-1.5 px-2 rounded min-w-max transition-colors ${viewMode === 'personal' ? 'bg-[#8E806A] font-bold text-white shadow-sm' : 'text-gray-300 hover:bg-[#5a544b]'}`}>個人點餐(小兔)</button>
          {viewMode !== 'personal' && <button onClick={handleScreenshot} className="bg-[#A69986] text-white px-3 py-1.5 text-sm rounded min-w-max flex items-center justify-center gap-1 hover:bg-[#8E806A] transition-colors"><Camera size={14}/> 截圖</button>}
        </div>
      </div>

      {}
      <div className="p-4" ref={viewMode !== 'personal' ? captureRef : null} style={{ backgroundColor: '#FAF9F6' }}>

        {viewMode === 'byRoom' && (
          <div>
            <div className="flex justify-center gap-4 mb-4 text-sm bg-white p-2 rounded shadow-sm border flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>盈螢早點</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>新協隆</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>東方美</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span>三隻小兔</span>
            </div>
            {(() => {
              const unpaidOrders = orders.filter(o => !o.isPaid);
              const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
              const unpaidRooms = unpaidOrders.map(o => o.roomNumber).join(', ');
              if (orders.length === 0) return null;
              return (
                <div data-html2canvas-ignore="true" className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-red-700 text-lg flex items-center gap-2">💰 未收款統計</span>
                    <span className="font-bold text-red-600 text-xl">${unpaidTotal}</span>
                  </div>
                  {unpaidRooms && <div className="text-sm text-red-600">未收款房間：{unpaidRooms}</div>}
                </div>
              );
            })()}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {orders.length === 0 && <div className="col-span-full text-center py-10 opacity-50">尚無訂單</div>}
              {orders.map(o => (
                <div key={o.id} className={`is-paid-card rounded shadow-sm overflow-hidden border ${o.isPaid ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
                  <div className={`is-paid-header px-3 py-2 border-b flex justify-between items-center ${o.isPaid ? 'bg-green-100' : 'bg-gray-50'}`}>
                    <div>
                      <span className="font-bold block">{o.roomNumber}房 {o.isPaid && <span data-html2canvas-ignore="true" className="text-xs text-green-600 font-normal ml-1">✅ 已結帳</span>}</span>
                      <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        <Clock size={10}/> {formatDate(o.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#8E806A]">${o.totalPrice}</span>
                      <button data-html2canvas-ignore="true" onClick={() => togglePaid(o.id, o.isPaid)} className={`text-xs px-2 py-1 rounded font-bold transition-colors ${o.isPaid ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                        {o.isPaid ? '已結帳' : '未結帳'}
                      </button>
                      <button data-html2canvas-ignore="true" onClick={() => deleteSingleOrder(o.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="刪除單筆訂單">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                  <div className="p-3 space-y-3">
                    {o.deviceOrders && (
                      <div data-html2canvas-ignore="true" className="space-y-3">
                        {Object.keys(o.deviceOrders).sort().map((uid, idx) => {
                          const deviceOrder = o.deviceOrders[uid];
                          const deviceLetter = String.fromCharCode(65 + idx);
                          const deviceName = deviceOrder.nickname ? `📱 ${deviceOrder.nickname}` : `📱 ${deviceLetter}裝置`;
                          return (
                            <div key={uid} className="border border-gray-200 rounded-md bg-gray-50 overflow-hidden shadow-sm">
                              <div className="flex justify-between items-center border-b border-gray-200 bg-gray-100 px-3 py-1.5">
                                <span className="font-bold text-xs text-[#595045] flex items-center gap-1.5">
                                  <Smartphone size={12} className="text-[#8E806A]"/> {deviceName}
                                  {o.deviceOrders[uid]?.updatedAt && (
                                    <span className="text-[10px] text-gray-400 font-mono font-normal ml-1 flex items-center gap-1">
                                      <Clock size={10}/>
                                      {formatDate(o.deviceOrders[uid].updatedAt)}
                                    </span>
                                  )}
                                </span>
                                <button data-html2canvas-ignore="true" onClick={() => deleteDeviceOrder(o.id, uid, deviceName)} className="text-gray-400 hover:text-red-500 p-0.5 bg-white rounded shadow-sm hover:shadow transition-all" title="刪除此裝置訂單"><Trash2 size={12}/></button>
                              </div>
                              <div className="p-2 space-y-1.5 bg-white">
                                {Object.entries(flattenItems(o.deviceOrders[uid].items)).map(([id, qty]) => {
                                  const baseId = getBaseId(id);
                                  const item = MENU_MAP[baseId];
                                  if (!item) return null;
                                  const dotColor = item.shopId === 'shopA' ? 'bg-orange-400' : item.shopId === 'shopB' ? 'bg-blue-400' : item.shopId === 'shopC' ? 'bg-green-500' : 'bg-pink-400';
                                  const suffix = getTempLabel(id, 'zh');
                                  const customSuffix = getCustomLabel(id);
                                  return <div key={id} className="flex justify-between text-[13px] items-center"><span className="flex gap-2 items-center"><span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span><span className="text-[#595045] font-medium">{item.name}</span> <span className="text-gray-400 text-[11px] bg-gray-50 px-1 rounded">{suffix}{customSuffix}</span></span><span className="font-bold text-[#8E806A] bg-gray-100 px-1.5 rounded-sm">x{qty}</span></div>;
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className={o.deviceOrders ? "hidden screenshot-visible space-y-1" : "space-y-1"}>
                      {Object.entries(flattenItems(o.items)).map(([id, qty]) => {
                        const baseId = getBaseId(id);
                        const item = MENU_MAP[baseId];
                        if (!item) return null;
                        const dotColor = item.shopId === 'shopA' ? 'bg-orange-400' : item.shopId === 'shopB' ? 'bg-blue-400' : item.shopId === 'shopC' ? 'bg-green-500' : 'bg-pink-400';
                        const suffix = getTempLabel(id, 'zh');
                        const customSuffix = getCustomLabel(id);
                        return <div key={id} className="flex justify-between text-sm"><span className="flex gap-2 items-center"><span className={`w-2 h-2 rounded-full ${dotColor}`}></span>{item.name} <span className="text-gray-500 text-xs">{suffix}{customSuffix}</span> <span className="text-gray-400 text-xs">(${item.price + getExtraPrice(id)})</span></span><span>x{qty}</span></div>;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'byItem' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['shopA', 'shopB', 'shopC', 'shopD'].map(sid => (
              <div key={sid} data-html2canvas-ignore={Object.keys(stats.s[sid]).length === 0 ? "true" : undefined} className="bg-white p-4 rounded shadow border-t-4 border-[#8E806A] flex flex-col">
                <h3 className="font-bold mb-2 flex gap-2 border-b pb-2">{sid === 'shopA' ? '盈螢' : sid === 'shopB' ? '新協隆' : sid === 'shopC' ? '東方美' : '三隻小兔'}</h3>
                <div className="flex-1">
                  {Object.values(stats.s[sid]).map(i => {
                    const suffix = getTempLabel(i.originalId, 'zh');
                    const customSuffix = getCustomLabel(i.originalId);
                    return (
                      <div key={i.originalId} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                        <span>{i.name} <span className="text-gray-500 text-xs">{suffix}{customSuffix}</span> <span className="text-gray-400 text-xs">(${i.price + getExtraPrice(i.originalId)})</span></span>
                        <span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-[#8E806A]">x{i.q}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-3 border-t-2 border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-600">店家總計</span>
                  <span className="font-bold text-lg text-[#8E806A]">${stats.shopTotals[sid]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'personal' && (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm border border-[#8E806A]/20">
              <div>
                <h2 className="font-bold text-lg text-[#595045] flex items-center gap-2">
                  <Coffee size={18} className="text-[#8E806A]"/> 茶雲居家成
                </h2>
                <div className="text-sm text-gray-500 mt-1">共選 {personalTotalQty} 項</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setPersonalCart({})} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">清空</button>
                <button onClick={generatePersonalOrderText} className="px-4 py-2 bg-[#8E806A] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#7a6d59] flex items-center justify-center gap-1 transition-colors"><Copy size={16}/> 複製點餐</button>
              </div>
            </div>

            <div>
              {(() => {
                const pItems = MENU_ITEMS.filter(i => i.shopId === 'shopD');
                const categoryOrder = ['雙人套餐', '漢堡類', '吐司類', '蛋餅類', '麵類', '單點小食', '飲料類', '其他'];
                const grouped = pItems.reduce((acc, i) => {
                  const cat = i.category || '其他';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(i);
                  return acc;
                }, {});
                return Object.keys(grouped).sort((a, b) => {
                  let ia = categoryOrder.indexOf(a);
                  let ib = categoryOrder.indexOf(b);
                  if (ia === -1) ia = 99;
                  if (ib === -1) ib = 99;
                  return ia - ib;
                }).map(cat => (
                  <div key={cat} className="mb-6">
                    <h2 className="font-bold text-[#8E806A] mb-3 border-b pb-1 text-base">{(CATEGORY_TEXT[cat] && CATEGORY_TEXT[cat][typeof lang !== 'undefined' ? lang : 'zh']) || cat}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {grouped[cat].map(i => {
                        const isDrink = i.hasTemp;
                        const isCustom = !!CUSTOMIZATION_OPTIONS[i.id];
                        const qtyIce = personalCart[i.id + '_ice'] || 0;
                        const qtyWarm = personalCart[i.id + '_warm'] || 0;
                        const customQty = isCustom ? Object.entries(personalCart).filter(([k]) => k.startsWith(i.id + '_custom:')).reduce((s, [,v]) => s + v, 0) : 0;
                        const qty = isDrink ? qtyIce + qtyWarm : isCustom ? customQty : (personalCart[i.id] || 0);

                        return (
                          <div key={i.id} className={`bg-white border p-3 rounded-lg flex flex-col justify-between transition-all ${qty ? 'border-[#8E806A] shadow-md ring-1 ring-[#8E806A]/30' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}>
                            <div className="mb-3">
                              <h3 className="font-bold text-[13px] text-[#595045] mb-1 leading-tight">{i.name}</h3>
                              <p className="text-xs text-gray-400 font-mono">${i.price}</p>
                            </div>
                            <div className="flex justify-between bg-gray-50 rounded p-1 mt-auto">
                              {isDrink ? (
                                <button
                                  onClick={() => setActivePersonalDrink(i)}
                                  className={`w-full text-xs py-1.5 font-bold rounded transition-colors ${qty > 0 ? 'bg-white text-[#8E806A] shadow-sm border border-[#8E806A]/20' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  {qty > 0 ? `已選 ${qty}` : '選擇冰/溫'}
                                </button>
                              ) : isCustom ? (
                                <button
                                  onClick={() => setActivePersonalCustomItem(i)}
                                  className={`w-full text-xs py-1.5 font-bold rounded transition-colors ${qty > 0 ? 'bg-white text-[#8E806A] shadow-sm border border-[#8E806A]/20' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                  {qty > 0 ? `已選 ${qty}` : CUSTOMIZATION_OPTIONS[i.id].label}
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => updatePersonalQty(i.id, -1)} disabled={!qty} className="w-8 h-8 flex items-center justify-center rounded bg-white text-gray-500 disabled:opacity-30 font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">-</button>
                                  <input type="number" value={qty || ""} onChange={(e) => handlePersonalExactQty(i.id, e.target.value)} className={`text-base font-bold w-10 text-center bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none flex items-center justify-center ${qty ? 'text-[#8E806A]' : 'text-gray-400'}`} />
                                  <button onClick={() => updatePersonalQty(i.id, 1)} className="w-8 h-8 flex items-center justify-center rounded bg-[#8E806A] text-white font-bold shadow-sm hover:bg-[#7a6d59] transition-colors">+</button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {activePersonalDrink && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white rounded-xl w-full max-w-xs p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b">
                    <h3 className="font-bold text-[#595045] text-lg">{activePersonalDrink.name}</h3>
                    <button onClick={() => setActivePersonalDrink(null)}><X size={24} className="text-gray-400 hover:text-gray-600 transition-colors"/></button>
                  </div>

                  <div className="flex justify-between items-center mb-5 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="font-bold text-blue-800 flex items-center gap-2"><span className="text-xl">🧊</span> 冰 (Ice)</span>
                    <div className="flex items-center gap-3 bg-white p-1 rounded-lg shadow-sm">
                      <button onClick={() => updatePersonalQty(activePersonalDrink.id + '_ice', -1)} disabled={!(personalCart[activePersonalDrink.id + '_ice'])} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 disabled:opacity-30 font-bold bg-gray-50 hover:bg-gray-100 transition-colors">-</button>
                      <input type="number" value={personalCart[activePersonalDrink.id + '_ice'] || ""} onChange={(e) => handlePersonalExactQty(activePersonalDrink.id + '_ice', e.target.value)} className="w-10 text-base text-center font-bold text-[#8E806A] bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      <button onClick={() => updatePersonalQty(activePersonalDrink.id + '_ice', 1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#8E806A] text-white font-bold hover:bg-[#7a6d59] transition-colors">+</button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-6 bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <span className="font-bold text-orange-800 flex items-center gap-2"><span className="text-xl">♨️</span> 溫 (Warm)</span>
                    <div className="flex items-center gap-3 bg-white p-1 rounded-lg shadow-sm">
                      <button onClick={() => updatePersonalQty(activePersonalDrink.id + '_warm', -1)} disabled={!(personalCart[activePersonalDrink.id + '_warm'])} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 disabled:opacity-30 font-bold bg-gray-50 hover:bg-gray-100 transition-colors">-</button>
                      <input type="number" value={personalCart[activePersonalDrink.id + '_warm'] || ""} onChange={(e) => handlePersonalExactQty(activePersonalDrink.id + '_warm', e.target.value)} className="w-10 text-base text-center font-bold text-[#8E806A] bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      <button onClick={() => updatePersonalQty(activePersonalDrink.id + '_warm', 1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#8E806A] text-white font-bold hover:bg-[#7a6d59] transition-colors">+</button>
                    </div>
                  </div>

                  <button onClick={() => setActivePersonalDrink(null)} className="w-full bg-[#8E806A] hover:bg-[#7a6d59] text-white py-3 rounded-lg font-bold shadow-md text-base transition-colors">確認完成</button>
                </div>
              </div>
            )}

            {activePersonalCustomItem && CUSTOMIZATION_OPTIONS[activePersonalCustomItem.id] && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="bg-white rounded-xl w-full max-w-xs p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b">
                    <h3 className="font-bold text-[#595045] text-lg">{activePersonalCustomItem.name}</h3>
                    <button onClick={() => setActivePersonalCustomItem(null)}><X size={24} className="text-gray-400 hover:text-gray-600 transition-colors"/></button>
                  </div>
                  {CUSTOMIZATION_OPTIONS[activePersonalCustomItem.id].options.map((opt, idx) => {
                    const cartKey = activePersonalCustomItem.id + '_custom:' + opt.value;
                    const optQty = personalCart[cartKey] || 0;
                    const bgColors = ['bg-amber-50 border-amber-100', 'bg-purple-50 border-purple-100', 'bg-teal-50 border-teal-100', 'bg-rose-50 border-rose-100'];
                    const textColors = ['text-amber-800', 'text-purple-800', 'text-teal-800', 'text-rose-800'];
                    return (
                      <div key={opt.value} className={`flex justify-between items-center mb-3 ${bgColors[idx % 4]} p-3 rounded-lg border`}>
                        <span className={`font-bold ${textColors[idx % 4]}`}>{opt.value + (opt.extraPrice ? ` (+$${opt.extraPrice})` : '')}</span>
                        <div className="flex items-center gap-3 bg-white p-1 rounded-lg shadow-sm">
                          <button onClick={() => updatePersonalQty(cartKey, -1)} disabled={!optQty} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 disabled:opacity-30 font-bold bg-gray-50 hover:bg-gray-100 transition-colors">-</button>
                          <input type="number" value={optQty || ""} onChange={(e) => handlePersonalExactQty(cartKey, e.target.value)} className="w-10 text-base text-center font-bold text-[#8E806A] bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                          <button onClick={() => updatePersonalQty(cartKey, 1)} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#8E806A] text-white font-bold hover:bg-[#7a6d59] transition-colors">+</button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => setActivePersonalCustomItem(null)} className="w-full bg-[#8E806A] hover:bg-[#7a6d59] text-white py-3 rounded-lg font-bold shadow-md text-base transition-colors">確認完成</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={clearOrders} message="確定清空所有客戶訂單？(個人點餐紀錄將不受影響)" />
      <LinkGeneratorModal isOpen={linkModal} onClose={() => setLinkModal(false)} />
    </div>
  );
};

const GlobalAlert = ({ lang = 'zh' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handler = (e) => {
      setMessage(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('show-alert', handler);
    return () => window.removeEventListener('show-alert', handler);
  }, []);

  if (!isOpen) return null;
  const t = UI_TEXT[lang] || UI_TEXT['zh'];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl w-full max-w-xs p-6 shadow-2xl text-center transform transition-all">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-[#8E806A]">
            <CheckCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-[#595045] mb-2">{t.alertTitle}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={() => setIsOpen(false)} className="w-full bg-[#8E806A] hover:bg-[#7a6d59] text-white py-2.5 rounded-lg font-bold transition-colors">{t.alertConfirm}</button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('zh');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginModal, setLoginModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [permError, setPermError] = useState(false);
  const [forcedShopId, setForcedShopId] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('shop');
    if (p === 'shopA' || p === 'shopB' || p === 'shopC' || p === 'shopD') setForcedShopId(p);

    signInAnonymously(auth).catch(e => {
      console.warn("Auth fallback", e);
      setUser({ uid: 'guest' });
    });
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;

    return onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'),
      snap => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setPermError(false);
      },
      err => { if (err.code === 'permission-denied') setPermError(true); }
    );
  }, [user]);

  if (!user) return <div className="h-screen flex items-center justify-center text-[#8E806A]">載入中...</div>;

  return (
    <div className="min-h-screen font-sans text-[#595045]">
      <GlobalAlert lang={lang} />
      <div className="fixed bottom-4 right-4 z-50">
        <button onClick={() => isAdmin ? setIsAdmin(false) : setLoginModal(true)} className="bg-[#4A453E] text-white p-3 rounded-full shadow-lg border border-[#8E806A] transition-transform hover:scale-110">
          {isAdmin ? <Users size={16}/> : <Lock size={16}/>}
        </button>
      </div>
      <AdminLoginModal isOpen={loginModal} onClose={() => setLoginModal(false)} onLogin={p => btoa(p) === 'ODg4OA==' && (setIsAdmin(true), setLoginModal(false))} />
      <PermissionFixModal isOpen={permError} />

      {isAdmin ? <OwnerDashboard orders={orders} /> : <GuestView orders={orders} forcedShopId={forcedShopId} user={user} lang={lang} setLang={setLang} />}
    </div>
  );
};

export default App;
