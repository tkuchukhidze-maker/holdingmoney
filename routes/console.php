<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Staff-only access through the deployment console until the authenticated
// control-center UI is available. No guest-readable booking list endpoint.
Artisan::command('booking:requests {reference?} {--venue=}', function () {
    $query = DB::table('booking_requests');
    if ($this->option('venue')) {
        $query->where('venue', $this->option('venue'));
    }
    if ($this->argument('reference')) {
        $row = $query->where('reference', $this->argument('reference'))->first();
        if (!$row) {
            $this->error('Request not found.');

            return 1;
        }
        $this->line(json_encode([
            'reference' => $row->reference, 'venue' => $row->venue,
            'date' => $row->date, 'time' => $row->time, 'guests' => $row->guests,
            'contact' => json_decode($row->contact, true),
            'occasion' => $row->occasion, 'budget' => $row->budget,
            'notes' => $row->notes, 'menu' => json_decode($row->menu, true),
            'total' => $row->total, 'status' => $row->status,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        return 0;
    }
    $this->table(
        ['Reference', 'Venue', 'Date', 'Time', 'Guests', 'Total GEL', 'Status'],
        $query->latest('id')->limit(50)->get(['reference', 'venue', 'date', 'time', 'guests', 'total', 'status'])->map(fn ($row) => (array) $row)->all()
    );

    return 0;
})->purpose('Review incoming restaurant booking requests and attached menus');
