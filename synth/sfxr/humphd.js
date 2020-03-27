// from https://github.com/humphd/sfxr.js/blob/master/sfxr.js

export default function (
  waveType,
  masterVolume,
  attackTime,
  sustainTime,
  sustainPunch,
  decayTime,
  startFrequency,
  minFrequency,
  slide,
  deltaSlide,
  vibratoDepth,
  vibratoSpeed,
  changeAmount,
  changeSpeed,
  squareDuty,
  dutySweep,
  repeatSpeed,
  phaserOffset,
  phaserSweep,
  lpFilterCutoff,
  lpFilterCutoffSweep,
  lpFilterResonance,
  hpFilterCutoff,
  hpFilterCutoffSweep,
) {
  let
    _period,
    _maxPeriod,
    _slide,
    _deltaSlide,
    _squareDuty,
    _dutySweep,
    _changeAmount,
    _changeTime,
    _changeLimit,
    _phase,
    _lpFilterPos,
    _lpFilterDeltaPos,
    _lpFilterCutoff,
    _lpFilterDeltaCutoff,
    _lpFilterDamping,
    _hpFilterPos,
    _hpFilterCutoff,
    _hpFilterDeltaCutoff,
    _vibratoPhase,
    _vibratoSpeed,
    _vibratoAmplitude,
    _envelopeVolume,
    _envelopeStage,
    _envelopeTime,
    _envelopeLength0,
    _envelopeLength1,
    _envelopeLength2,
    _envelopeLength,
    _envelopeOverLength0,
    _envelopeOverLength1,
    _envelopeOverLength2,
    _phaserOffset,
    _phaserDeltaOffset,
    _phaserPos,
    _phaserBuffer,
    _noiseBuffer,
    _repeatTime,
    _repeatLimit;

  function reset(totalReset) {
    _period = 100.0 / (startFrequency * startFrequency + 0.001);
    _maxPeriod = 100.0 / (minFrequency * minFrequency + 0.001);

    _slide = 1.0 - slide * slide * slide * 0.01;
    _deltaSlide = -deltaSlide * deltaSlide * deltaSlide * 0.000001;

    _squareDuty = 0.5 - squareDuty * 0.5;
    _dutySweep = -dutySweep * 0.00005;

    if (changeAmount > 0.0) _changeAmount = 1.0 - changeAmount * changeAmount * 0.9;
    else _changeAmount = 1.0 + changeAmount * changeAmount * 10.0;

    _changeTime = 0;

    if (changeSpeed === 1.0) _changeLimit = 0;
    else _changeLimit = (1.0 - changeSpeed) * (1.0 - changeSpeed) * 20000 + 32;

    if (totalReset) {
      _phase = 0;

      _lpFilterPos = 0.0;
      _lpFilterDeltaPos = 0.0;
      _lpFilterCutoff = lpFilterCutoff * lpFilterCutoff * lpFilterCutoff * 0.1;
      _lpFilterDeltaCutoff = 1.0 + lpFilterCutoffSweep * 0.0001;
      _lpFilterDamping = 5.0 / (1.0 + lpFilterResonance * lpFilterResonance * 20.0) * (0.01 + _lpFilterCutoff)
      if (_lpFilterDamping > 0.8) _lpFilterDamping = 0.8;

      _hpFilterPos = 0.0;
      _hpFilterCutoff = hpFilterCutoff * hpFilterCutoff * 0.1;
      _hpFilterDeltaCutoff = 1.0 + hpFilterCutoffSweep * 0.0003;

      _vibratoPhase = 0.0;
      _vibratoSpeed = vibratoSpeed * vibratoSpeed * 0.01;
      _vibratoAmplitude = vibratoDepth * 0.5;

      _envelopeVolume = 0.0;
      _envelopeStage = 0;
      _envelopeTime = 0;
      _envelopeLength0 = attackTime * attackTime * 100000.0;
      _envelopeLength1 = sustainTime * sustainTime * 100000.0;
      _envelopeLength2 = decayTime * decayTime * 100000.0;
      _envelopeLength = _envelopeLength0;


      _envelopeOverLength0 = 1.0 / _envelopeLength0;
      _envelopeOverLength1 = 1.0 / _envelopeLength1;
      _envelopeOverLength2 = 1.0 / _envelopeLength2;

      _phaserOffset = phaserOffset * phaserOffset * 1020.0;
      if (phaserOffset < 0.0) _phaserOffset = -_phaserOffset;
      _phaserDeltaOffset = phaserSweep * phaserSweep;
      if (_phaserDeltaOffset < 0.0) _phaserDeltaOffset = -_phaserDeltaOffset;
      _phaserPos = 0;

      if (!_phaserBuffer) _phaserBuffer = new Float32Array(1024);
      if (!_noiseBuffer) _noiseBuffer = new Float32Array(32);
      for (var i = 0; i < 1024; i++) _phaserBuffer[i] = 0.0;
      for (var i = 0; i < 32; i++) _noiseBuffer[i] = Math.random() * 2.0 - 1.0;

      _repeatTime = 0;

      if (repeatSpeed == 0.0) _repeatLimit = 0;
      else _repeatLimit = Math.floor((1.0 - repeatSpeed) * (1.0 - repeatSpeed) * 20000) + 32;
    }
  };

  reset(true);

  let buffer = [];
  let length = _envelopeLength0 + _envelopeLength1 + _envelopeLength2;
  let finished = false;

  for (var i = 0; i < length; i++) {
    if (finished) return;

    if (_repeatLimit != 0) {
      if (++_repeatTime >= _repeatLimit) {
        _repeatTime = 0;
        reset(false);
      }
    }

    if (_changeLimit != 0) {
      if (++_changeTime >= _changeLimit) {
        _changeLimit = 0;
        _period *= _changeAmount;
      }
    }

    _slide += _deltaSlide;
    _period = _period * _slide;

    if (_period > _maxPeriod) {
      _period = _maxPeriod;
      if (minFrequency > 0.0) finished = true;
    }

    let _periodTemp = _period;

    if (_vibratoAmplitude > 0.0) {
      _vibratoPhase += _vibratoSpeed;
      _periodTemp = _period * (1.0 + Math.sin(_vibratoPhase) * _vibratoAmplitude);
    }

    _periodTemp = Math.floor(_periodTemp);
    if (_periodTemp < 8) _periodTemp = 8;

    _squareDuty += _dutySweep;
    if (_squareDuty < 0.0) _squareDuty = 0.0;
    else if (_squareDuty > 0.5) _squareDuty = 0.5;

    if (++_envelopeTime > _envelopeLength) {
      _envelopeTime = 0;

      switch (++_envelopeStage) {
        case 1:
          _envelopeLength = _envelopeLength1;
          break;
        case 2:
          _envelopeLength = _envelopeLength2;
          break;
      }
    }

    switch (_envelopeStage) {
      case 0:
        _envelopeVolume = _envelopeTime * _envelopeOverLength0;
        break;
      case 1:
        _envelopeVolume = 1.0 + (1.0 - _envelopeTime * _envelopeOverLength1) * 2.0 * sustainPunch;
        break;
      case 2:
        _envelopeVolume = 1.0 - _envelopeTime * _envelopeOverLength2;
        break;
      case 3:
        _envelopeVolume = 0.0;
        finished = true;
        break;
    }

    _phaserOffset += _phaserDeltaOffset;
    let _phaserInt = Math.floor(_phaserOffset);
    if (_phaserInt < 0) _phaserInt = -_phaserInt;
    else if (_phaserInt > 1023) _phaserInt = 1023;

    if (_hpFilterDeltaCutoff != 0.0) {
      // what is this???  --> _hpFilterCutoff *- _hpFilterDeltaCutoff;
      _hpFilterCutoff *= _hpFilterDeltaCutoff;
      if (_hpFilterCutoff < 0.00001) _hpFilterCutoff = 0.00001;
      else if (_hpFilterCutoff > 0.1) _hpFilterCutoff = 0.1;
    }

    let _superSample = 0.0;
    for (var j = 0; j < 8; j++) {
      let _sample = 0.0;
      _phase++;
      if (_phase >= _periodTemp) {
        _phase = _phase % _periodTemp;
        if (waveType == 3) {
          for (var n = 0; n < 32; n++) _noiseBuffer[n] = Math.random() * 2.0 - 1.0;
        }
      }

      const _pos = _phase / _periodTemp;

      switch (waveType) {
        case 0:
          _sample = (_pos < _squareDuty) ? 0.5 : -0.5;
          break;
        case 1:
          _sample = 1.0 - _pos * 2.0;
          break;
        case 2:
          _sample = Math.sin(_pos * Math.PI * 2.0);
          break;
        case 3:
          _sample = _noiseBuffer[Math.floor(_phase * 32 / Math.floor(_periodTemp))];
          break;
      }

      const _lpFilterOldPos = _lpFilterPos;
      _lpFilterCutoff *= _lpFilterDeltaCutoff;
      if (_lpFilterCutoff < 0.0) _lpFilterCutoff = 0.0;
      else if (_lpFilterCutoff > 0.1) _lpFilterCutoff = 0.1;

      if (lpFilterCutoff != 1.0) {
        _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff * 4;
        _lpFilterDeltaPos -= _lpFilterDeltaPos * _lpFilterDamping;
      }
      else {
        _lpFilterPos = _sample;
        _lpFilterDeltaPos = 0.0;
      }

      _lpFilterPos += _lpFilterDeltaPos;

      _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
      _hpFilterPos -= _hpFilterPos * _lpFilterCutoff;
      _sample = _hpFilterPos;

      _phaserBuffer[_phaserPos & 1023] = _sample;
      _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) & 1023];
      _phaserPos = (_phaserPos + 1) & 1023;

      _superSample += _sample;
    }

    _superSample = masterVolume * masterVolume * _envelopeVolume * _superSample / 8.0;

    if (_superSample > 1.0) _superSample = 1.0;
    if (_superSample < -1.0) _superSample = -1.0;

    buffer[i] = _superSample;
    buffer[i + 1] = _superSample;
  }

  return buffer;
}


