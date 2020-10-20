/* 

byRow : [['LABEL 1', 'LABEL 2'],[row0col0, row0col1]...]
byCol : {'LABEL 1':[row0col0, row1col0...], 'LABEL 2':[row0col1data, row1col1...]}
dictByRow : [{'LABEL 1':row0col0, 'LABEL 2', row0col1}, {'LABEL 1':row1col0, 'LABEL 2':row1col1}]

*/
class Uji {
  // data assumed to be row array. static methods can go both ways ...
  constructor(dataByRow, dataByCol, meta) {
    this.byRow = dataByRow || Uji.cols2rows(dataByCol);
    this.byCol = dataByCol || Uji.rows2cols(dataByRow);
    this.headers =  this.byRow[0]; //always assume headers row? TODO force A,B,C headers if row[0] is all numeric/sequential once col types are checked
    if(meta) {
      Uji.store(this, meta); //todo umm (needs ids or useless, start w/ fetch fn + query str as metadata?)
    }
  }

  static store(uji, meta) {
    if (!this._store) {
      this._store = {};
    }
    if(uji !== undefined && meta) {
      this._store[meta] = uji;
    }
    else if (meta && this._store.includes(meta)) {
      return this._store[meta]
    }
    else if (Object.keys(this._store).length > 0) {
      return this._store[Object.keys(this._store)[0]]
    }
  }

  static lastStored() {
    return this._store[this._store.length-1];
  }

  static cols2rows(dataByCol) {
    if(!dataByCol) {//TODO check structure, col types
      return;
    }
    let headers = Object.keys(dataByCol);
    let rows = [];
    dataByCol[0].forEach((v,i) => {
      rows.push(headers.map((h,hi) => {
       return dataByCol[h][i]; 
      }));
    });
    console.log(rows);
    return rows;
  }

  static rows2cols(dataByRow) {
    if(!dataByRow) {
      return;
    }

    let headers = dataByRow[0]; // headers assumption todo already in constructor....
    let rows = dataByRow.slice(1);
    let columns = {};
    headers.forEach((h,hi) => {
      columns[h] = [];
    });
    rows.forEach((r,ri) => {
      headers.forEach((h,hi) => {
        columns[h][ri] = r[hi];
      });
    });
    console.log(columns);
    return columns;
  }


///////////////////////////////////////

  static smooth(calcVals) {
    var smoothWith = [];
    var smoothMax = 3;
    const ticksPerMonth = 21.5; //(365*(5/7))/12;
    const monthSpan = Math.round(calcVals.length / ticksPerMonth);
    if(monthSpan > 1 && monthSpan < 6) {
      smoothMax = 7;
    }
    else if(monthSpan >= 6) {
      smoothMax = 21;
    }

    return calcVals.map((v,vi) => {
      if (smoothWith.length == smoothMax) {
        smoothWith = smoothWith.slice(1);
      }
      smoothWith.push(v);

      if(smoothWith.length > 1) {
        return smoothWith.reduce((acc,n) => acc+n) / smoothWith.length;
      }
      else {
        return v;
      }
    });
  }

  static log(calcVals) {
    return calcVals.map((v) => Math.log(v));
  }

  static index(calcVals) {
    return calcVals.map((v,i,a) => (v/a[0])*100); //TODO why is array sorted backwards here? clearer to fix elsewhere and use a[0] here ...
  }

  //////////////////////////////////////

  static combine(cols, data) {
    return data.map((row) => 
            cols.map((vc) => row[vc])
              .reduce((acc,n) => acc*n)
    );
  }

  static flatten(vals) {
    if(this.stack) {
      this.stack.forEach((transform,i) => {
        vals = transform(vals);
      });
    }
    return vals;
  }

  static flattenStack(cols, data) {
    return Uji.flatten(Uji.combine(cols, data));
  }

  static stackOn(transform) {
    if(!this.stack) {
      this.stack=[transform];
    }
    else if (!this.stack.includes(transform)) {
      this.stack.push(transform);
    }
  }

  static stackOff(transform) {
    if(this.stack && this.stack.includes(transform)) {
      this.stack.splice(this.stack.indexOf(transform),1);
    }
  }
}

//export default Uji;