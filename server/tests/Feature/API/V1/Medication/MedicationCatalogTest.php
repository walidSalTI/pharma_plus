<?php

declare(strict_types=1);

use App\Models\Medication;

it('lists medications publicly', function () {
    Medication::factory()->count(5)->create();

    $response = $this->getJson('/api/v1/medications');

    $response->assertStatus(200)
        ->assertJsonStructure(['data', 'meta']);
    expect(count($response->json('data')))->toBe(5);
});

it('filters medications by name', function () {
    Medication::factory()->create(['trade_name' => 'Paracetamol 500mg']);
    Medication::factory()->create(['trade_name' => 'Ibuprofen 200mg']);

    $response = $this->getJson('/api/v1/medications?name=Paracetamol');

    $response->assertStatus(200);
    expect(count($response->json('data')))->toBe(1);
    expect($response->json('data.0.trade_name'))->toBe('Paracetamol 500mg');
});
