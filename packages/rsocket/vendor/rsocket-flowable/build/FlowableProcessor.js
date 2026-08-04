                                                                          

export default class FlowableProcessor      
                                                                {
  _transformer          ;
  _source               ;
  _sink                ;
  _subscription               ;
  _done         ;
  _error       ;

  constructor(source               , fn           ) {
    this._source = source;
    this._transformer = fn;
    this._done = false;
    this._mappers = []; //mappers for map function
  }

  onSubscribe(subscription               ) {
    this._subscription = subscription;
  }

  onNext(t   ) {
    if (!this._sink) {
      console.warn('premature onNext for processor, dropping value');
      return;
    }

    let val = t;
    if (this._transformer) {
      val = this._transformer(t);
    }
    const finalVal = this._mappers.reduce(
      (interimVal, mapper) => mapper(interimVal),
      val,
    );
    this._sink.onNext(finalVal);
  }

  onError(error       ) {
    this._error = error;
    if (!this._sink) {
      console.warn('premature onError for processor, marking complete/errored');
    } else {
      this._sink.onError(error);
    }
  }

  onComplete() {
    this._done = true;
    if (!this._sink) {
      console.warn('premature onError for processor, marking complete');
    } else {
      this._sink.onComplete();
    }
  }

  subscribe(subscriber                ) {
    if (this._source.subscribe) {
      this._source.subscribe(this);
    }
    this._sink = subscriber;
    this._sink.onSubscribe(this);

    if (this._error) {
      this._sink.onError(this._error);
    } else if (this._done) {
      this._sink.onComplete();
    }
  }

  map   (fn          ) {
    this._mappers.push(fn);
    return this;
  }

  request(n        ) {
    this._subscription && this._subscription.request(n);
  }

  cancel() {
    this._subscription && this._subscription.cancel();
  }
}
