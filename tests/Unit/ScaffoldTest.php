<?php

it('uses the required PHP 8.3 or newer runtime', function () {
    expect(PHP_VERSION_ID)->toBeGreaterThanOrEqual(80300);
});
