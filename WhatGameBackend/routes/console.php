<?php
use Illuminate\Support\Facades\Schedule;
use App\Http\Controllers\VoteController;

Schedule::call([VoteController::class, "deleateEmptyAndOldLobbys"])->twiceDaily(
    1,
    13,
);
