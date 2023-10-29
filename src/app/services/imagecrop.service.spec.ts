import { TestBed } from '@angular/core/testing';

import { ImagecropService } from './imagecrop.service';

describe('ImagecropService', () => {
  let service: ImagecropService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImagecropService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
