import Card from './Card.js';
import Game from './Game.js';
import {setSpeedRate as setGameSpeedRate} from './SpeedRate.js';
import CardView from "./CardView.js";

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}


// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}


class Creature extends Card {
    constructor(name, maxPower) {
        super(name, maxPower);
        this._currentPower = maxPower;
    }

    get currentPower() {
        return this._currentPower;
    }

    set currentPower(value) {
        if (value <= this.maxPower) {
            this._currentPower = value;
        } else {
            this._currentPower = this.maxPower;
        }
    }

    getDescriptions() {
        if (this instanceof Lad) {
            return [super.getDescriptions(), getCreatureDescription(this), 'Чем их больше, тем они сильнее']
        }
        return [super.getDescriptions(), getCreatureDescription(this)];
    }
}

// Основа для утки.
/*function Duck() {
    this.quacks = () => { console.log('quack') };
    this.swims = () => { console.log('float: both;') };
}*/
class Duck extends Creature {
    constructor(name = 'Мирная утка', maxPower = 2) {
        super(name, maxPower);
        this.quacks = () => { console.log('quack') };
        this.swims = () => { console.log('float: both;') };
    }
}


// Основа для собаки.
/*function Dog() {
    this.swims = () => { console.log('float: none;') };
}*/
class Dog extends Creature {
    constructor(name = 'Пес-бандит', maxPower = 3) {
        super(name, maxPower);
        this.swims = () => { console.log('float: none;') };
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        super.doBeforeRemoving(continuation);
    };

    static getBonus() {
        return this.getInGameCount() * (this.getInGameCount() + 1) / 2;
    };

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        super.modifyDealedDamageToCreature(value + Lad.getBonus(), toCard, gameContext, continuation);
    };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value - Lad.getBonus() <= 0) {
            gameContext.oppositePlayer.table[gameContext.position].view.signalAbility(continuation);
        }
        super.modifyTakenDamage(value - Lad.getBonus(), fromCard, gameContext, continuation);
    };
}

class Rogue extends Creature {
    constructor() {
        super('Изгой', 2);
    }


    doBeforeAttack(gameContext, continuation) {
        if (Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position])
            .hasOwnProperty('modifyDealedDamageToCreature')) {
            this.modifyDealedDamageToCreature =
                Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position]).modifyDealedDamageToCreature;
            delete Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position])['modifyDealedDamageToCreature'];
        }
        if (Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position])
            .hasOwnProperty('modifyDealedDamageToPlayer')) {
            this.modifyDealedDamageToPlayer =
                Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position]).modifyDealedDamageToPlayer;
            delete Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position])['modifyDealedDamageToPlayer'];
        }
        if (Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position])
            .hasOwnProperty('modifyTakenDamage')) {
            this.modifyTakenDamage =
                Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position]).modifyTakenDamage;
            delete Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position])['modifyTakenDamage'];
        }
        gameContext.updateView();
        super.doBeforeAttack(gameContext, continuation);
    }
}

class Brewer extends Duck {
    constructor() {
        super('Пивовар', 2);
    }

    doBeforeAttack(gameContext, continuation) {
        gameContext.currentPlayer.table.concat(gameContext.oppositePlayer.table).forEach(function (card) {
            if (isDuck(card)) {
                card.maxPower++;
                card.currentPower = card.currentPower + 2;
                card.view.signalHeal(continuation);
                card.updateView();
            }
        });
        super.doBeforeAttack(gameContext, continuation);
    }
}

class Nemo extends Creature {
    constructor() {
        super('Немо', 4);
    }

    doBeforeAttack(gameContext, continuation) {
        Object.setPrototypeOf(this, Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position]));
        gameContext.updateView();
        if (Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position]).hasOwnProperty('doBeforeAttack')) {
            gameContext.oppositePlayer.table[gameContext.position].doBeforeAttack(gameContext, continuation);
        }
        super.doBeforeAttack(gameContext, continuation);
    }
}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Nemo(),
    new Duck(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Brewer(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
setGameSpeedRate(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
