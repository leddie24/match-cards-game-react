const CARDCHECKTIME = 300;

var NumberCard = React.createClass({
   getInitialState: function() {
      return {
         clickable: true,
         selected: false,
         valid: false
      };
   },
   guessCard: function(card) {
      if (this.state.clickable && (this.props.guessesLeft > 0)) {
         this.props.guessCard(card);
         this.setState({ 
            selected: true,
            clickable: false
         });
      }
   },
   disableCard: function() {
      this.setState({
         clickable: false
      });
   },
   enableCard: function() {
      this.setState({
         clickable: true
      });
   },
   removeCard: function() {
      this.setState({
         clickable: false,
         selected: false,
         valid: true
      });
   },
   resetCard: function() {
      this.setState(this.getInitialState());
   },
   render: function() {
      var className = "number-card h ";
      if (this.state.selected) {
         className += "selected flipped";
      }
      if (this.state.valid) {
         className += "valid flipped";
      }
      return (
         <div 
            className={className}
            onClick={this.guessCard.bind(null, this)} >
            <div className="front"></div>
            <div className="back">{this.props.number}</div>
         </div>
      );
   }
});

var GameInfo = React.createClass({
   startGame: function() {
      this.props.startGame();
   },
   render: function() {
      return (
         <div className="row">
            <div className="col-xs-6 col-xs-offset-3">
               <h1>Match Pairs</h1>
               <p>
                  Welcome to Match Pairs.  Each level starts out with pairs of cards that you match with each other.
               </p>
               <p>
                  Each round you have 2 hints (which show all cards for 3 seconds), and 3 tries.
               </p>
               <p>Press ESC to cancel an accidental selection (NOTE: you can only do this once per level)</p>
               <button className="btn btn-primary" onClick={this.startGame}>Start Game</button>
            </div>
         </div>
      );
   }
});


var GameBoard = React.createClass({
   getInitialState: function() {
      var cards = this.makeCards(this.props.pairs);
      return {
         pairs: this.props.pairs,
         level: this.props.level,
         startGame: false,
         hints: 2,
         guessesLeft: 3,
         cancels: 1,
         cards: cards,
         matchedCards: [],
         selectedCards: []
      }
   },
   makeCards: function(num) {
      var cards = []
      for (var i = 1; i <= num; i++) {
         cards.push(i);
         cards.push(i);
      }
      cards = this.shuffleCards(cards);
      return cards;
   },
   shuffleCards: function(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

         // Pick a remaining element...
         randomIndex = Math.floor(Math.random() * currentIndex);
         currentIndex -= 1;

         // And swap it with the current element.
         temporaryValue = array[currentIndex];
         array[currentIndex] = array[randomIndex];
         array[randomIndex] = temporaryValue;
      }

      return array;
   },
   startGame: function(time = this.state.level * 1500) {
      this.setState({
         startGame: true
      }, function() {
         this.showHint(time);
         document.addEventListener("keydown", this._clearSelected, false);
      }.bind(this));
   },
   disableCard: function(number = null) {
      if (!number) {
         for (var i = 0; i < this.state.cards.length; i++) {
            this.refs['number'+ i].disableCard();
         }
      } else {
         this.refs['number'+ number].disableCard();
      }
   },
   enableCard: function(number = null) {
      if (!number) {
         for (var i = 0; i < this.state.cards.length; i++) {
            this.refs['number'+ i].enableCard();
         }
      } else {
         this.refs['number'+ number].enableCard();
      }
   },
   showHint: function(time = 3000) {
      var cards = document.getElementsByClassName("number-card");
      for (var i = 0; i < cards.length; i++) {
         cards[i].classList.add("visible");
         this.refs['number'+ i].disableCard();
      }
      setTimeout(function() {
         for (var i = 0; i < cards.length; i++) {
            cards[i].classList.remove("visible");
            this.refs['number'+ i].enableCard();
         }
      }.bind(this), time);
   },
   guessCard: function(card) {
      if (this.state.guessesLeft > 0) {
         var selectedCards = this.state.selectedCards;
         selectedCards = selectedCards.concat([card]);
         this.setState({
            selectedCards: selectedCards
         });

         // check cards if it equals 2
         if (selectedCards.length >= 2) {
            this.disableCard();
            this.checkMatch(selectedCards);
            setTimeout(function() {
               this.enableCard();
            }.bind(this), CARDCHECKTIME);
         }
      } 
   },
   checkMatch: function(cards) {
      if (cards[0].props.number === cards[1].props.number) {
         setTimeout(function() {
            var matchedCards = this.state.matchedCards;
            var number = cards[0].props.number;
            for (var i = 0; i < cards.length; i++) {
               cards[i].removeCard();
            }
            matchedCards = matchedCards.concat([number]);
            this.setState({
               matchedCards: matchedCards
            }, function() {
               this.checkWin();
            });
         }.bind(this), CARDCHECKTIME);
      }
      // No match for both cards
       else {
         var guessesLeft = this.state.guessesLeft;
         guessesLeft--;
         this.setState({
            guessesLeft: guessesLeft
         });

         // No guesses left, game is over
         if (guessesLeft === 0) {
            console.log(this.state.level);
            localStorage.setItem("matchCardsScore", this.state.level);
         }
         setTimeout(function() {
            for (var i = 0; i < cards.length; i++) {
               cards[i].resetCard();
            }
         }, CARDCHECKTIME);
      }
      this.setState({
         selectedCards: []
      });
   },
   checkWin: function() {
      if (this.state.matchedCards.length === this.state.cards.length / 2) {
         var that = this;
         setTimeout(function() {
            that.setState({
               cards: []
            }, function() {
               setTimeout(function() {
                  var pairs = this.state.pairs + 1;
                  var level = this.state.level + 1;
                  var hs = localStorage.getItem("matchCardsScore");
                  if (level > hs) {
                     localStorage.setItem("matchCardsScore", level);
                  }
                  var cards = this.makeCards(pairs);
                  this.setState({
                     pairs: pairs,
                     level: level,
                     startGame: true,
                     hints: 2,
                     guessesLeft: 3,
                     cancels: 1,
                     cards: cards,
                     matchedCards: [],
                     selectedCards: []
                  }, function() {
                     // Reset card classes from previous level
                     var currCards = document.getElementsByClassName("number-card");
                     for (var i = 0; i < currCards.length; i++) {
                        currCards[i].classList.remove("flipped");
                        currCards[i].classList.remove("valid");
                     }
                     this.startGame();
                  });
               }.bind(that), 1000)
            });
         }, 500);      
      }
   },
   useHint: function() {
      if (this.state.hints > 0) {
         this.showHint();
         var hints = this.state.hints - 1;
         this.setState({
            hints: hints
         });
      }
   },
   _clearSelected:function(event){
      if(event.keyCode == 27 && this.state.cancels > 0){
         var cancels = this.state.cancels;
         cancels--;
         this.state.selectedCards.forEach(function(card) {
            card.resetCard();
         });
         this.setState({
            selectedCards: [],
            cancels: cancels
         });
      }
   },
   render: function() {
      if (this.state.startGame) {
         return (
            <div className="container">
               <div className="row">
                  <div id="GameBoard" className="col-xs-10">
                     {this.state.cards.map(function(number, idx) {
                        return (
                           <NumberCard
                              number={number}
                              key={idx}
                              ref={'number' + idx}
                              guessCard={this.guessCard}
                              guessesLeft={this.state.guessesLeft} 
                           />
                        );
                     }.bind(this))}
                  </div>
                  <div id="PlayerScore" className="col-xs-2">
                     <PlayerControls 
                        hints={this.state.hints}
                        useHint={this.useHint}
                        guessesLeft={this.state.guessesLeft}
                        level={this.state.level}
                     />
                  </div>
               </div>
            </div>
         ); 
      } else {
         return (
            <div className="container">
               <GameInfo startGame={this.startGame} />
            </div>
         );
      }
   }
});

var PlayerControls = React.createClass({
   useHint: function() {
      this.props.useHint();
   },
   render: function () {
      var disabled = (this.props.hints === 0);
      var hs = localStorage.getItem("matchCardsScore");
      var highScore = (!hs) ? "" : "High Score: " + hs;
      return (
         <div>
            <h3>Level {this.props.level}</h3>
            <button className="btn btn-primary" disabled={disabled} onClick={this.useHint}>{this.props.hints} Hints Remaining</button>
            <p>{this.props.guessesLeft} tries left</p>
            <p>{highScore}</p>
         </div>
      );
   }
});

var MatchCardsGame = React.createClass({
   render: function() {
      return (
         <div>
            <GameBoard pairs={4} level={1} />
         </div>
      );
   }
});

ReactDOM.render(
   <MatchCardsGame />,
   document.getElementById('matchGame')
);