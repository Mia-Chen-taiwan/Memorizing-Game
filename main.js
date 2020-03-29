const GAME_STATE = {
    FirstCardAwaits: "FirstCardAwaits",
    SecondCardAwaits: "SecondCardAwaits",
    CardMatchFailed: "CardMatchFailed",
    CardMatched: "CardMatched",
    GameFinished: "GameFinished",
}

const Symbols = [
    'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
    'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
    'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
    'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
  ]

const view = {
    getCardElement(index) {
        return `<div data-index="${index}" class="card back"></div>`
    },
    getCardContent(index){//分開處理牌內的內容，方便翻面操作
        const number = this.transformNumber((index % 13) + 1)
        const symbol = Symbols[Math.floor(index / 13)]
        return `
          <p>${number}</p>
          <img src="${symbol}"  />
          <p>${number}</p>
        `
    },
    transformNumber (number) {//將部分數字轉為英文字母
        switch (number) {
            case 1://number符合1時
                return 'A'//回傳A
            case 11:
                return 'J'
            case 12:
                return 'Q'
            case 13:
                return 'K'
            default:
                return number
        }
    },
    displayCards (indexes) {
        const rootElement = document.querySelector('#cards')
        rootElement.innerHTML = indexes
        .map(index => this.getCardElement(index)).join("")//this === view
        //使用Array.from(Array(52).keys())產生0-51數字陣列
        //用join("")將陣列合併成一大字串
    },
    //flipCard (card)
    //flipCards (1,2,...,n)
    //cards = [1,2,...,n]
    flipCards (...cards) {
        cards.map(card => {
            if (card.classList.contains('back')) {
                //回傳正面
                card.classList.remove('back')
                card.innerHTML = this.getCardContent(Number(card.dataset.index))
                return
    
            }
            //回傳背面
            card.classList.add('back')
            card.innerHTML = null
        })
    },
    pairCards (...cards) {
        cards.map(card => {
            card.classList.add('paired')
        })
    },
    renderScore (score) {
        document.querySelector(".score").innerHTML = `Score: ${score}`
    },
    renderTriedTImes (times) {
        document.querySelector(".tried").innerHTML = `You've tried: ${times} times`
    },
    appendWrongAnimation (...cards) {
        cards.map(card => {
            card.classList.add('wrong')
            card.addEventListener('animationend', event =>
            event.target.classList.remove('wrong'), 
            { once: true })//要求在事件執行一次之後，就要卸載這個監聽器(減輕瀏覽器負擔)
        })
    },
    showGameFinished () {
        const div = document.createElement('div')
        div.classList.add('completed')
        div.innerHTML = `
          <p>YEAH!!COMPLETED!!</p>
          <p>Score: ${model.score}</p>
          <p>You've tried: ${model.triedTimes} times</p>
        `
        const header = document.querySelector('#header')
        header.before(div)
    }
}

//資料管理
const model = {
    score: 0,
    triedTimes: 0,
    revealedCards: [],
    //check兩張牌有無配對成功
    isRevealedCardsMatched() {
        return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
    }
  }

//溝通協調
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards () {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  //依照不同的遊戲狀態，做不同的行為
  dispatchCardAction (card) {
      //挑出「非牌背」的牌
      if (!card.classList.contains('back')) {
          return
      }
      switch (this.currentState) {
          //第一張牌翻開
          case GAME_STATE.FirstCardAwaits:
              view.flipCards(card)
              model.revealedCards.push(card)
              this.currentState = GAME_STATE.SecondCardAwaits
              break
          //第二章牌翻開
          case GAME_STATE.SecondCardAwaits:
              view.flipCards(card)
              view.renderTriedTImes(++model.triedTimes)
              model.revealedCards.push(card)
              //判斷是否成功
              if (model.isRevealedCardsMatched()) {
                  //配對成功
                  view.renderScore(model.score += 10)
                  this.currentState = GAME_STATE.CardMatched
                  view.pairCards(...model.revealedCards)
                  model.revealedCards = []
                  //完成遊戲
                  if (model.score === 260) {
                      console.log('showGameFinished')
                      this.currentState = GAME_STATE.GameFinished
                      view.showGameFinished()
                      return
                  }
                  this.currentState = GAME_STATE.FirstCardAwaits
              } else {
                  //配對失敗
                  controller.currentState = GAME_STATE.CardMatchFailed
                  view.appendWrongAnimation(...model.revealedCards)
                  setTimeout(this.resetCards, 1000)
              }
              break
      }
      //debugging
      console.log('this.currentState', this.currentState)
      console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards () {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
    //這裡的controller不可用this，因為包在setTimeout()裡面
  },

}

//外掛函式庫
const utility = {
    //Fisher-Yates Shuffle洗牌演算法
    getRandomNumberArray(count) {
      //count = 5 => [0,1,2,3,4]
      const number =  Array.from(Array(count).keys())
      for (let index = number.length - 1; index > 0; index--){
          let randomIndex = Math.floor(Math.random() * (index + 1))
          ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]//交換值
      }
      return number
    }
}
controller.generateCards()
//Node list (array-like)
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
      controller.dispatchCardAction(card)
  })
})