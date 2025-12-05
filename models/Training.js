const mongoose = require('mongoose');

const trainingProgramSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: String,
    duration: String,
    status: {
        type: String,
        enum: ['Active', 'Upcoming', 'Completed'],
        default: 'Upcoming',
    },
    startDate: Date,
    endDate: Date,
}, {
    timestamps: true,
});

const trainingEventSchema = mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    date: Date,
    time: String,
    type: String,
    participants: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
});

module.exports = {
    TrainingProgram: mongoose.model('TrainingProgram', trainingProgramSchema),
    TrainingEvent: mongoose.model('TrainingEvent', trainingEventSchema)
};
