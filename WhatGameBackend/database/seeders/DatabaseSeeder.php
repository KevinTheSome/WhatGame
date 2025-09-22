<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'testtest',
            'email' => 'test@test.test',
            'password' => Hash::make('testtest')
        ]);
        User::factory()->create([
            'name' => 'testtest2',
            'email' => 'test2@test2.test2',
            'password' => Hash::make('testtest2')
        ]);
    }
}
