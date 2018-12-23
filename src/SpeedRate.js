const SpeedRate = function() {
    let speedRate = 1;

    function set(value) {
        speedRate = value;
    }

    function get() {
        return speedRate;
    }

    return {
        set,
        get
    };
}();

export default SpeedRate;

export const getSpeedRate = SpeedRate.get;
export const setSpeedRate = SpeedRate.set;