
/** Two-Dimensional vector */
export class Vector2D {
    constructor(X?, Y?) {
        this.X = X
        this.Y = Y
    }
    X:number
    Y:number
    /** 
     * Returns this minus given Vector2D with element-wise substraction, given Vector2D objects are not changed.
     * @param b Vector2D to substract by
     * @returns result of substraction
    */
    public sub(b:Vector2D):Vector2D {
        let ret = new Vector2D()
        ret.X = this.X - b.X
        ret.Y = this.Y - b.Y
        return ret
    }

    /**
     * !Important! Calculates Euclidean distance, do not use for lat/long
     * @param b (Vector2D) to calculate euclidean distance to
     */
    public distance(b:Vector2D):number {
        return Math.sqrt(Math.pow(this.X - b.X, 2) + Math.pow(this.Y - b.Y, 2))
    }
}
