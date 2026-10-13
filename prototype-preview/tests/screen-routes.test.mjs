import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCREEN_PATHS, screenFromPath, screenPath, isKnownScreen } from '../src/screen-routes.js';

test('every approved screen has a unique public URL, with Main at the root', () => {
  assert.equal(Object.keys(SCREEN_PATHS).length, 9);
  assert.equal(new Set(Object.values(SCREEN_PATHS)).size, 9);
  assert.equal(screenFromPath('/'), 'Main');
  for (const [screen, path] of Object.entries(SCREEN_PATHS)) {
    assert.equal(screenFromPath(path), screen);
    assert.equal(screenFromPath(path + '/'), screen);
    assert.equal(screenPath(screen), path);
    assert.equal(isKnownScreen(screen), true);
  }
});

test('previous account and venue links still resolve in the preview', () => {
  assert.equal(screenFromPath('/places/batumi'), 'Batumi');
  assert.equal(screenFromPath('/places/magnolia'), 'Magnolia');
  assert.equal(screenFromPath('/auth'), 'Register');
  assert.equal(screenFromPath('/account'), 'MyEpisode');
  assert.equal(screenFromPath('/dashboard'), 'Admin');
});

test('the viewer does not route unknown names into arbitrary files', () => {
  assert.equal(screenFromPath('/unknown'), null);
  assert.equal(screenFromPath('/something/else'), null);
  assert.equal(isKnownScreen('../README'), false);
  assert.equal(isKnownScreen('Foo'), false);
  assert.equal(screenPath('Foo'), '/');
});
