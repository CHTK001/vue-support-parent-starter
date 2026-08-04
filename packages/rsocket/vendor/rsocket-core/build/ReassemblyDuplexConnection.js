             
                   
        
              
                
            
                   
                       
import {LiteBuffer as Buffer} from './LiteBuffer';
import {Flowable} from 'rsocket-flowable';
import {
  CONNECTION_STREAM_ID,
  isComplete,
  isFollows,
  FRAME_TYPES,
  FLAGS,
} from './RSocketFrame';

export class ReassemblyDuplexConnection                             {
  _source                  ;

  constructor(source                  ) {
    this._source = source;
  }

  sendOne(frame       )       {
    this._source.sendOne(frame);
  }

  send(input                 )       {
    this._source.send(input);
  }

  receive()                  {
    return this._source
      .receive()
      .lift(actual => new ReassemblySubscriber(actual));
  }

  close()       {
    this._source.close();
  }

  connect()       {
    this._source.connect();
  }

  connectionStatus()                             {
    return this._source.connectionStatus();
  }
}

class ReassemblySubscriber                                                     {
  _framesReassemblyMap                     = new Map();

  _actual                    ;
  _subscription               ;

  constructor(actual                    ) {
    this._actual = actual;
  }

  request(n        ) {
    this._subscription.request(n);
  }

  cancel() {
    this._subscription.cancel();
    this._framesReassemblyMap.clear();
  }

  onSubscribe(s               )       {
    if (this._subscription == null) {
      this._subscription = s;
      this._actual.onSubscribe(this);
    } else {
      s.cancel();
    }
  }

  onComplete()       {
    this._actual.onComplete();
  }

  onError(error       )       {
    this._actual.onError(error);
  }

  onNext(frame       )       {
    const streamId = frame.streamId;
    if (streamId !== CONNECTION_STREAM_ID) {
      const hasFollowsFlag = isFollows(frame.flags);
      const hasCompleteFlag = isComplete(frame.flags);
      const isCancelOrError =
        frame.type === FRAME_TYPES.ERROR || frame.type === FRAME_TYPES.CANCEL;

      const storedFrame = this._framesReassemblyMap.get(streamId);
      if (storedFrame) {
        if (isCancelOrError) {
          this._framesReassemblyMap.delete(streamId);
        } else {
          if (storedFrame.metadata && frame.metadata) {
            storedFrame.metadata = concatContent(
              storedFrame.metadata,
              frame.metadata,
            );
          }

          if (storedFrame.data && frame.data) {
            storedFrame.data = concatContent(storedFrame.data, frame.data);
          } else if (!storedFrame.data && frame.data) {
            storedFrame.data = frame.data;
          }

          if (!hasFollowsFlag || hasCompleteFlag) {
            if (hasCompleteFlag) {
              storedFrame.flags |= FLAGS.COMPLETE;
            }

            this._framesReassemblyMap.delete(streamId);
            this._actual.onNext(storedFrame);
          }

          return;
        }
      } else if (hasFollowsFlag && !hasCompleteFlag && !isCancelOrError) {
        this._framesReassemblyMap.set(streamId, frame);

        return;
      }
    }

    this._actual.onNext(frame);
  }
}

const concatContent = (a           , b           )            => {
  switch (a.constructor.name) {
    case 'String':
      return a + b;
    case 'Uint8Array':
      const result = new Uint8Array(a.length + b.length);
      result.set(a);
      result.set(b, a.length);
      return result;
    default:
      return Buffer.concat([a, b]);
  }
};
